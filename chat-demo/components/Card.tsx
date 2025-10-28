interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

const Card = ({ children, title, className = '' }: CardProps) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};

export default Card;

