import React from 'react';
import { Database, AlertTriangle, ExternalLink } from 'lucide-react';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';

export const FirebaseErrorView: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-[#050505]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-zinc-900 border border-white/10 rounded-3xl p-8 text-center space-y-6 shadow-2xl"
      >
        <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-3xl flex items-center justify-center mx-auto">
          <Database className="w-10 h-10" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            Firebase Chưa Thiết Lập
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Hệ thống cơ sở dữ liệu Firebase (Firestore) chưa được khởi tạo cho ứng dụng này. 
            Vui lòng thực hiện thiết lập để sử dụng các tính năng Sáng tác, Lịch sử và Kho tri thức.
          </p>
        </div>

        <div className="bg-black/40 rounded-2xl p-4 text-left space-y-3 border border-white/5">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Hướng dẫn xử lý:</h3>
          <ul className="text-sm text-zinc-300 space-y-2">
            <li className="flex gap-2">
              <span className="text-amber-500 font-bold">1.</span>
              Mở bảng điều khiển <strong>Firebase</strong> trong AI Studio.
            </li>
            <li className="flex gap-2">
              <span className="text-amber-500 font-bold">2.</span>
              Nhấn <strong>"Set up Firebase"</strong> và làm theo hướng dẫn.
            </li>
            <li className="flex gap-2">
              <span className="text-amber-500 font-bold">3.</span>
              Sau khi hoàn tất, nhấn nút <strong>"Kiểm tra lại"</strong> bên dưới.
            </li>
          </ul>
        </div>

        <button 
          onClick={() => window.location.reload()}
          className="w-full py-3 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 transition-colors"
        >
          Kiểm tra lại kết nối
        </button>

        <div className="pt-2 text-xs text-zinc-500">
          Mã lỗi: <code>FIREBASE_NOT_INITIALIZED</code>
        </div>
      </motion.div>
    </div>
  );
};
