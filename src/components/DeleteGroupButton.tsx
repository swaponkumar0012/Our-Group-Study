'use client';

import { Trash2 } from 'lucide-react';
import { deleteGroup } from '@/lib/actions';

export default function DeleteGroupButton({ groupId, showText = false }: { groupId: string, showText?: boolean }) {
    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (confirm('Are you sure you want to delete this group? All related quiz results and messages will be permanently removed.')) {
            try {
                await deleteGroup(groupId);
            } catch (err: any) {
                alert(err.message || 'Failed to delete group');
            }
        }
    };

    return (
        <button
            onClick={handleDelete}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold text-sm hover:bg-red-500/20 transition-all shadow-lg`}
            title="Delete Group"
        >
            <Trash2 size={16} />
            {showText && <span>Delete Group</span>}
            {!showText && <span className="text-xs uppercase tracking-wider">Delete</span>}
        </button>
    );
}
