interface ToastProps {
  message: string;
  isVisible: boolean;
}

export default function Toast({ message, isVisible }: ToastProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-gray-900 border border-gray-600 p-3 shadow-lg">
      <p className="text-green-400 text-xs font-mono">
        {message}
      </p>
    </div>
  );
} 