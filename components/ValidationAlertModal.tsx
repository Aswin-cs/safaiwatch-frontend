"use client";

import React, { useEffect } from "react";
import { AlertTriangle, AlertCircle, X, ShieldAlert, ArrowRight } from "lucide-react";

export interface ValidationErrorItem {
  field?: string;
  path?: (string | number)[];
  message: string;
  code?: string;
}

export interface ValidationAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  errors?: ValidationErrorItem[] | string[] | any;
}

export function extractExactValidationMessages(message?: string, errors?: any): string[] {
  const result: string[] = [];

  if (Array.isArray(errors) && errors.length > 0) {
    errors.forEach((err: any) => {
      if (typeof err === "string") {
        result.push(err);
      } else if (err && typeof err === "object") {
        const fieldName = err.field || (Array.isArray(err.path) && err.path.length > 0 ? err.path.join('.') : null);
        if (fieldName && err.message) {
          result.push(`${fieldName}: ${err.message}`);
        } else if (err.message) {
          result.push(err.message);
        } else {
          result.push(JSON.stringify(err));
        }
      }
    });
  }

  if (result.length === 0) {
    if (message && message.trim()) {
      result.push(message);
    } else {
      result.push("Validation Error: Please check your inputs.");
    }
  }

  return result;
}

export default function ValidationAlertModal({
  isOpen,
  onClose,
  title = "Validation Error",
  message = "Validation Error",
  errors,
}: ValidationAlertModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const exactMessages = extractExactValidationMessages(message, errors);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-enter select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-[28px] border-2 border-[#ba1a1a]/40 shadow-2xl overflow-hidden transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning Header Banner */}
        <div className="bg-gradient-to-r from-[#ffdad6] via-[#ffeceb] to-[#ffdad6] p-5 border-b border-[#ba1a1a]/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ba1a1a]/15 text-[#93000a] flex items-center justify-center shrink-0 border border-[#ba1a1a]/30 shadow-xs">
              <ShieldAlert className="w-5 h-5 text-[#ba1a1a] animate-pulse" />
            </div>
            <div>
              <span className="font-mono text-[10px] font-bold text-[#ba1a1a] uppercase tracking-widest bg-[#ba1a1a]/10 px-2 py-0.5 rounded-full border border-[#ba1a1a]/20">
                Warning Alert
              </span>
              <h3 className="font-['Hanken_Grotesk'] text-lg font-extrabold text-[#93000a] leading-tight mt-0.5">
                {title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[#93000a] hover:bg-[#ba1a1a]/10 p-1.5 rounded-full transition-colors cursor-pointer"
            title="Close warning alert"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Body Content */}
        <div className="p-6 flex flex-col gap-4 bg-white">
          <div className="flex items-start gap-2.5 text-xs text-[#3d4a42]">
            <AlertCircle className="w-4 h-4 text-[#ba1a1a] shrink-0 mt-0.5" />
            <p className="font-medium leading-relaxed">
              The backend validation schema detected issues with your submitted information:
            </p>
          </div>

          {/* Exact Error Messages Container */}
          <div className="bg-[#fff8f7] border-l-4 border-[#ba1a1a] rounded-r-2xl p-4 flex flex-col gap-2 shadow-2xs">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#93000a] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#ba1a1a]" />
              Exact Error Message{exactMessages.length > 1 ? "s" : ""}:
            </span>

            <ul className="flex flex-col gap-2 mt-1">
              {exactMessages.map((msg, index) => {
                const parts = msg.split(/:(.+)/);
                const isFieldFormat = parts.length > 1;

                return (
                  <li
                    key={index}
                    className="text-xs font-semibold text-[#680007] bg-white/80 p-2.5 rounded-xl border border-[#ffdad6] flex items-start gap-2 shadow-2xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a] mt-1.5 shrink-0"></span>
                    <div className="flex-1 break-words">
                      {isFieldFormat ? (
                        <>
                          <span className="font-mono text-[11px] bg-[#93000a]/10 text-[#93000a] px-1.5 py-0.5 rounded font-bold mr-1.5 uppercase">
                            {parts[0].trim()}
                          </span>
                          <span>{parts[1].trim()}</span>
                        </>
                      ) : (
                        <span>{msg}</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Footer Action Button */}
        <div className="p-4 bg-[#FAF8FF] border-t border-[#E2E7FF] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#ba1a1a] hover:bg-[#93000a] text-white font-['Hanken_Grotesk'] text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <span>Understood &amp; Fix Input</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
