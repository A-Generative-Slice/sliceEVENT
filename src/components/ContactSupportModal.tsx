import React, { useState } from 'react';
import {
  X,
  Mail,
  MessageCircle,
  Clock,
  MessageSquare,
  Send,
  CheckCircle2,
  Sparkles,
  Heart,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface ContactSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactSupportModal: React.FC<ContactSupportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSent, setTicketSent] = useState(false);

  if (!isOpen) return null;

  const handleSendTicket = (e: React.FormEvent) => {
    e.preventDefault();
    setTicketSent(true);
    setTimeout(() => {
      setTicketSent(false);
      setTicketSubject('');
      setTicketMessage('');
      onClose();
    }, 3000);
  };

  const whatsappNumber = '917812891494';
  const whatsappMsg = encodeURIComponent(
    'Hello A Generative Slice Team, I need support/assistance with A Generative Slice application.'
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMsg}`;

  const developerEmail = 'agenerativeslice@gmail.com';
  const mailtoUrl = `mailto:${developerEmail}?subject=Support%20Inquiry%20-%20The%20Velvet%20Trunk`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#ffffff] rounded-3xl border border-[#ffe0cc] shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with A Generative Slice Company Logo */}
        <div className="bg-gradient-to-r from-[#C2500A] via-[#a8400a] to-[#E8621A] p-5 text-white flex items-center justify-between relative overflow-hidden">
          <div className="flex items-center gap-3.5 z-10">
            {/* Company Logo Badge */}
            <div className="w-12 h-12 rounded-2xl bg-white p-1 shadow-md shrink-0 border border-white/30 overflow-hidden flex items-center justify-center">
              <img
                src="agenerativeslicelogo.jpg"
                alt="A Generative Slice Logo"
                className="w-full h-full object-contain rounded-xl"
                onError={(e) => {
                  // Fallback if image fails to load
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-black text-base sm:text-lg tracking-tight text-white">
                  A Generative Slice
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#ffb347] text-[#C2500A] text-[9px] font-black uppercase">
                  DEVELOPER TEAM
                </span>
              </div>
              <p className="text-xs text-[#ffd7f5] font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#ffb347]" />
                Customer Support & Concierge Assistance
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-95 z-10"
            title="Close Support Window"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Background Decorative Blob */}
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Respect & Appreciation Banner for Exhibition Organizers */}
          <div className="bg-gradient-to-r from-[#fff5ee] via-[#fffbf7] to-[#f7e8f3] p-4 rounded-2xl border border-[#ffe0cc] space-y-2 relative">
            <div className="flex items-center gap-2 text-[#C2500A]">
              <Heart className="w-4 h-4 text-[#E8621A] fill-[#E8621A]" />
              <h3 className="text-xs font-black uppercase tracking-wider">
                Honoring Your Event Excellence
              </h3>
            </div>
            <p className="text-xs text-[#4a3b30] leading-relaxed font-medium">
              At <strong className="text-[#C2500A]">A Generative Slice</strong>, we deeply respect and admire the vision, effort, and passion exhibition organizers bring to life. Crafting unforgettable expos, managing stall layouts, and empowering local artisans is a massive feat. We built <strong>A Generative Slice</strong> to streamline your operations, and we are dedicated to supporting your success every step of the way!
            </p>
          </div>

          {/* 1-Click Contact Buttons (WhatsApp & Email) */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#C2500A] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#E8621A]" /> Direct 1-Click Contact
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* WhatsApp 1-Click Chat Link */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-sm hover:shadow-md active:scale-98 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                    <MessageCircle className="w-5 h-5 fill-white" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-emerald-100 uppercase block">
                      WhatsApp 1-Click Chat
                    </span>
                    <span className="text-xs font-black text-white">
                      +91 78128 91494
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-emerald-200 group-hover:translate-x-0.5 transition-transform" />
              </a>

              {/* Developer Email Link */}
              <a
                href={mailtoUrl}
                className="p-3.5 rounded-2xl bg-[#C2500A] hover:bg-[#a8400a] text-white font-bold transition-all shadow-sm hover:shadow-md active:scale-98 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-[#ffb347] shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <span className="text-[10px] font-extrabold text-[#ffb347] uppercase block">
                      Developer Email
                    </span>
                    <span className="text-xs font-extrabold text-white truncate block">
                      agenerativeslice@gmail.com
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-[#ffb347] shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>

          {/* Support Availability Notice */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-900">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Concierge Hours:</strong> Monday – Saturday (9:00 AM to 9:00 PM IST) • Quick response guaranteed!
            </span>
          </div>

          {/* Support Inquiry Form */}
          <div className="space-y-3 pt-2 border-t border-[#fff0e6]">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#C2500A] flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-[#E8621A]" /> Request Custom Feature or Technical Support
            </h3>

            {ticketSent ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-2xl flex items-center gap-3 animate-fadeIn">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-black text-emerald-950">Thank you so much!</p>
                  <p className="text-emerald-800 font-medium mt-0.5">
                    Your request has been received by the A Generative Slice engineering team. We will get back to you shortly.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendTicket} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-[#C2500A] block mb-1">
                    Subject / Custom Feature Request
                  </label>
                  <input
                    type="text"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="e.g. Custom stall layout requirement or feedback"
                    required
                    className="w-full px-3.5 py-2.5 bg-[#ffffff] border border-[#f5c9a8] rounded-xl text-xs font-medium text-[#1c1612] focus:outline-hidden focus:border-[#C2500A]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#C2500A] block mb-1">
                    Message Details
                  </label>
                  <textarea
                    rows={3}
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    placeholder="Describe how we can customize or enhance your exhibition management experience..."
                    required
                    className="w-full px-3.5 py-2.5 bg-[#ffffff] border border-[#f5c9a8] rounded-xl text-xs font-medium text-[#1c1612] focus:outline-hidden focus:border-[#C2500A]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-[#C2500A] to-[#a8400a] text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4 text-[#ffb347]" /> Send Message to A Generative Slice Team
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#fff5ee] px-6 py-3 border-t border-[#ffe0cc] flex items-center justify-between text-[11px] text-[#7c6354]">
          <span className="font-bold text-[#C2500A]">Powered by A Generative Slice</span>
          <button
            onClick={onClose}
            className="font-bold text-[#C2500A] hover:underline"
          >
            Close Support Window
          </button>
        </div>
      </div>
    </div>
  );
};
