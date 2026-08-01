import React from 'react';
import { MessageSquare } from 'lucide-react';
import Inbox from './Inbox';

const accentIcon = {
  rose: 'text-rose-500',
  amber: 'text-amber-500',
  blue: 'text-blue-500',
  teal: 'text-teal-500'
};

const NoticeChatPanel = ({ accent = 'teal', description }) => (
  <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-4 h-[520px] flex flex-col">
    <div className="flex-shrink-0 flex items-center gap-2">
      <MessageSquare className={`w-5 h-5 ${accentIcon[accent] || accentIcon.teal}`} />
      <div>
        <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">In-App Chat Support Center</h3>
        <p className="text-[10px] text-gray-400">{description}</p>
      </div>
    </div>
    <div className="flex-grow overflow-hidden relative">
      <Inbox />
    </div>
  </div>
);

export default NoticeChatPanel;
