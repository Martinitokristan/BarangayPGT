import Navbar from '@/components/layout/Navbar';
import DeviceVerification from '@/components/auth/DeviceVerification';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {/* DeviceVerification will overlay the page if device is not trusted */}
            <DeviceVerification />
            <Navbar />
            <main className="max-w-6xl mx-auto px-4 py-6">
                {children}
            </main>
        </>
    );
}
