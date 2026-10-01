import Link from "next/link";
export default function NotFound() { 
    return (
        <>
            {/* Shown when a requested note or tag does not exist. */}
            <h1>Not found</h1>
            
            {/* Explain what kind of resource could not be found. */}
            <p>This note or tag does not exist.</p>
            
            {/* Give the user a simple way back to the main notes page. */}
            <Link href="/">
                Back to all notes
            </Link>
        </>
    ); 
}
