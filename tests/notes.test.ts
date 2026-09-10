import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createNoteStore, NoteConflictError, NoteNotFoundError } from "../lib/notes.ts";
import { parseNote, serializeNote } from "../lib/frontmatter.ts";
import { filterNotes, tagCounts } from "../lib/model.ts";
import { renderMarkdown } from "../lib/markdown.ts";

const input = { title: 'A "quoted": title', body: "# Hello\n\nA searchable body.\n---\n", tags: ["Work", "work", " learning "] };

test("CRUD persists frontmatter, preserves identity, and rejects stale writes", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "notely-"));
  try {
    const store = createNoteStore(dir);
    const first = await store.create(input);
    const second = await store.create(input);
    assert.notEqual(first.id, second.id);
    assert.deepEqual(first.tags, ["work", "learning"]);
    assert.deepEqual(parseNote(await readFile(path.join(dir, `${first.id}.md`), "utf8"), first.id), first);
    assert.deepEqual(await createNoteStore(dir).get(first.id), first, "survives a new store instance");
    const updated = await store.update(first.id, { ...input, title: "Renamed", tags: [] }, first.updatedAt);
    assert.equal(updated.id, first.id);
    assert.equal(updated.createdAt, first.createdAt);
    assert.ok(updated.updatedAt > first.updatedAt);
    assert.deepEqual(updated.tags, []);
    await assert.rejects(store.update(first.id, input, first.updatedAt), NoteConflictError);
    await assert.rejects(store.remove(first.id, first.updatedAt), NoteConflictError);
    await store.remove(first.id, updated.updatedAt);
    assert.equal(await store.get(first.id), null);
    await assert.rejects(store.update(first.id, input, updated.updatedAt), NoteNotFoundError);
    assert.equal((await store.list()).length, 1);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("serialized mutations allow only one concurrent update at a given revision", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "notely-"));
  try {
    const store = createNoteStore(dir);
    const note = await store.create(input);
    const results = await Promise.allSettled([store.update(note.id, input, note.updatedAt), store.update(note.id, input, note.updatedAt)]);
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(results.filter((result) => result.status === "rejected").length, 1);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("invalid slugs, symlinks, malformed metadata, and invalid input are rejected", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "notely-"));
  try {
    const store = createNoteStore(dir);
    for (const slug of ["../.env", "a/b", "new", "..", "%2e%2e", "a".repeat(161)]) assert.equal(await store.get(slug), null);
    await writeFile(path.join(dir, "private.txt"), "secret");
    await symlink(path.join(dir, "private.txt"), path.join(dir, "linked.md"));
    await assert.rejects(store.get("linked"));
    assert.deepEqual(await store.list(), []);
    await assert.rejects(store.create({ ...input, title: " " }));
    await assert.rejects(store.create({ ...input, body: "x".repeat(100001) }));
    await assert.rejects(store.create({ ...input, tags: ["../bad"] }));
    const note = await store.create(input);
    assert.throws(() => parseNote(serializeNote(note), "different-id"));
    assert.throws(() => parseNote("---\ntitle: unquoted\n---\nbody", "example"));
    assert.throws(() => parseNote(serializeNote(note).replace('title:', 'unknown:'), note.id));
    assert.equal(parseNote(serializeNote(note).replaceAll("\n", "\r\n"), note.id).title, note.title);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("full-text terms and tags compose with AND semantics", () => {
  const notes = [
    { ...input, id: "one", title: "Alpha", body: "The BETA body", tags: ["work", "learning"], createdAt: "", updatedAt: "" },
    { ...input, id: "two", title: "Beta", body: "Gamma", tags: ["work"], createdAt: "", updatedAt: "" },
  ];
  assert.equal(filterNotes(notes, "   ", []).length, 2);
  assert.deepEqual(filterNotes(notes, "ALPHA beta", ["WORK", "learning"]).map((note) => note.id), ["one"]);
  assert.equal(filterNotes(notes, "Gamma", ["learning"]).length, 0);
  assert.deepEqual(tagCounts(notes), [["learning", 1], ["work", 2]]);
});

test("markdown retains formatting while removing executable and tracking markup", () => {
  const html = renderMarkdown('# Heading\n\n**bold**\n\n<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n[bad](javascript:alert%281%29)\n\n<a href="jav&#x61;script:alert(1)" onclick="alert(1)">bad</a>\n\n<iframe src="https://example.com"></iframe>\n\n[good](https://example.com)');
  assert.match(html, /<h1>Heading<\/h1>/);
  assert.match(html, /<strong>bold<\/strong>/);
  assert.match(html, /href="https:\/\/example.com"/);
  assert.doesNotMatch(html, /<script|<img|<iframe|javascript:|onclick|onerror/);
});
