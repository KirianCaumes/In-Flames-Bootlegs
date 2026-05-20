import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center px-4">
            <p className="text-8xl font-bold text-orange-500 mb-4">404</p>
            <h1 className="text-2xl font-semibold text-gray-100 mb-2">Page Not Found</h1>
            <p className="text-gray-400 mb-8 text-center">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
            <Link
                href="/"
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-medium transition-colors"
            >
                Back to Archive
            </Link>
        </div>
    )
}
