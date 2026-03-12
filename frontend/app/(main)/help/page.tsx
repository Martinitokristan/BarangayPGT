import React from 'react';
import { HiQuestionMarkCircle, HiMail } from 'react-icons/hi';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Help & Support | BarangayPGT',
};

export default function HelpPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl bg-white rounded-2xl shadow-sm mt-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <HiQuestionMarkCircle className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
                    <p className="text-gray-500">Need assistance?</p>
                </div>
            </div>
            
            <div className="py-8 divide-y divide-gray-100">
                <div className="pb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Frequently Asked Questions</h3>
                    <p className="text-gray-500 mb-4 text-sm">Find answers to common questions about BarangayPGT.</p>
                    
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-xl">
                            <h4 className="font-medium text-gray-900 mb-1">How do I post an emergency?</h4>
                            <p className="text-gray-600 text-sm">Click the "Create Post" button, select "Emergency" as the Purpose, and choose "High - Urgent" as the Urgency level. This will notify the barangay officials immediately.</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl">
                            <h4 className="font-medium text-gray-900 mb-1">Can I change my registered barangay?</h4>
                            <p className="text-gray-600 text-sm">Currently, your account is permanently tied to Barangay Pagatpatan. If you moved, you will need to request an administrator to delete or migrate your account.</p>
                        </div>
                    </div>
                </div>

                <div className="pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Contact Us</h3>
                    <p className="text-gray-500 mb-4 text-sm">If you need further assistance from the Barangay Hall administrators.</p>
                    
                    <a href="mailto:support@barangaypgt.com" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-medium hover:bg-indigo-100 transition-colors">
                        <HiMail className="w-5 h-5" />
                        Email Support Team
                    </a>
                </div>
            </div>
        </div>
    );
}
