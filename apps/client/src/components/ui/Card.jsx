/** @param {{ className?: string } & React.HTMLAttributes<HTMLDivElement>} props */
export default function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`rounded-2xl bg-gray-900 p-4 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
