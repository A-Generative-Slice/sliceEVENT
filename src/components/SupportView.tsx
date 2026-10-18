import React from 'react';
import {
  MessageCircle,
  Phone,
  Mail,
  Heart,
  ExternalLink,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

interface SupportViewProps {
  onBack: () => void;
}

export const SupportView: React.FC<SupportViewProps> = ({ onBack }) => {
  const whatsappNumber = '917812891494';
  const whatsappMsg = encodeURIComponent(
    'Hello A Generative Slice Team, I need support / custom updates for A Generative Slice.'
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMsg}`;
  const phoneUrl = `tel:+${whatsappNumber}`;
  const mailtoUrl = `mailto:agenerativeslice@gmail.com?subject=Support%20Inquiry%20-%20The%20Velvet%20Trunk`;

  return (
    <div className="flex flex-col gap-6 pb-16 w-full max-w-3xl mx-auto animate-fadeIn">
      {/* Top Navigation Back Header */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-[#ffffff] border border-[#ffe0cc] flex items-center justify-center text-[#C2500A] shadow-xs active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <span className="text-xs font-extrabold uppercase tracking-widest text-[#E8621A] flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" /> Concierge & Developer Support
        </span>
      </div>

      {/* Main Header Banner Card */}
      <div className="bg-gradient-to-br from-[#C2500A] via-[#a8400a] to-[#E8621A] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#ffffff] p-2 shadow-lg border border-white/20 shrink-0 flex items-center justify-center overflow-hidden">
          <img
            src="agenerativeslicelogo.jpg"
            alt="A Generative Slice Logo"
            className="w-full h-full object-contain rounded-xl"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        <div className="space-y-1 z-10">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              A Generative Slice
            </h1>
            <Sparkles className="w-5 h-5 text-[#ffb347]" />
          </div>
          <p className="text-xs sm:text-sm text-[#ffd7f5] font-medium leading-relaxed max-w-lg">
            Powered by A Generative Slice.
          </p>
        </div>

        {/* Soft Background Accent */}
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Clean Appreciation Message */}
      <div className="bg-[#ffffff] rounded-2xl border border-[#ffe0cc] p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-[#C2500A]">
          <Heart className="w-4 h-4 text-[#E8621A] fill-[#E8621A]" />
          <h2 className="text-xs font-black uppercase tracking-wider">
            Honoring Your Event Excellence
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-[#4a3b30] leading-relaxed font-medium">
          We deeply respect and appreciate the dedication, vision, and hard work exhibition organizers bring to life. For app updates, custom features, or technical support, please contact us directly via WhatsApp or phone call.
        </p>
      </div>

      {/* Direct Contact Options (Spacious & Minimalist) */}
      <div className="space-y-4 pt-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#C2500A] px-1">
          Direct Contact Channels
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {/* WhatsApp Direct Chat */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md hover:shadow-lg active:scale-98 flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white shrink-0">
                <MessageCircle className="w-6 h-6 fill-white" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold text-emerald-100 uppercase block tracking-wider">
                  WhatsApp Direct Chat
                </span>
                <span className="text-base font-black text-white block mt-0.5">
                  +91 78128 91494
                </span>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-emerald-200 group-hover:translate-x-1 transition-transform" />
          </a>

          {/* Direct Phone Call */}
          <a
            href={phoneUrl}
            className="p-5 rounded-2xl bg-[#ffffff] hover:bg-[#fff5ee] border border-[#f5c9a8] text-[#C2500A] font-bold transition-all shadow-xs hover:shadow-md active:scale-98 flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#fff5ee] text-[#E8621A] flex items-center justify-center shrink-0 border border-[#ffe0cc]">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold text-[#7c6354] uppercase block tracking-wider">
                  Direct Phone Call
                </span>
                <span className="text-base font-black text-[#C2500A] block mt-0.5">
                  +91 78128 91494
                </span>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-[#E8621A] group-hover:translate-x-1 transition-transform" />
          </a>

          {/* Email Support */}
          <a
            href={mailtoUrl}
            className="p-5 rounded-2xl bg-[#ffffff] hover:bg-[#fff5ee] border border-[#f5c9a8] text-[#C2500A] font-bold transition-all shadow-xs hover:shadow-md active:scale-98 flex items-center justify-between group"
          >
            <div className="flex items-center gap-4 truncate">
              <div className="w-12 h-12 rounded-2xl bg-[#fff5ee] text-[#C2500A] flex items-center justify-center shrink-0 border border-[#ffe0cc]">
                <Mail className="w-6 h-6" />
              </div>
              <div className="truncate">
                <span className="text-[11px] font-extrabold text-[#7c6354] uppercase block tracking-wider">
                  Developer Email
                </span>
                <span className="text-base font-black text-[#C2500A] truncate block mt-0.5">
                  agenerativeslice@gmail.com
                </span>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-[#E8621A] group-hover:translate-x-1 transition-transform shrink-0" />
          </a>
        </div>
      </div>
    </div>
  );
};
