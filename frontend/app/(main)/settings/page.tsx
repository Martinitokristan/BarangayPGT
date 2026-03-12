import React from 'react';
import { HiCog } from 'react-icons/hi';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Settings | BarangayPGT',
};

export default function SettingsPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl bg-white rounded-2xl shadow-sm mt-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <HiCog className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-500">Manage your account preferences</p>
                </div>
            </div>
            
            <div className="py-12 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mb-4">
                    <HiCog className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Coming Soon</h3>
                <p className="text-gray-500 max-w-sm">
                    We are currently building the settings module. You will be able to update your notification preferences and account details here soon.
                </p>
            </div>
        </div>
    );
}
