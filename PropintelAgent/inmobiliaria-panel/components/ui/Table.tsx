import { ReactNode } from 'react';

interface TableProps {
  children: ReactNode;
  className?: string;
}

interface TableHeaderProps {
  children: ReactNode;
  className?: string;
}

interface TableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

interface TableCellProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className = '' }: TableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = '' }: TableHeaderProps) {
  return (
    <thead className={className}>
      {children}
    </thead>
  );
}

export function TableRow({ children, className = '', onClick }: TableRowProps) {
  return (
    <tr 
      className={`border-b hover:bg-gray-50 transition-colors duration-150 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, className = '' }: TableCellProps) {
  return (
    <td className={`py-3 px-4 ${className}`}>
      {children}
    </td>
  );
}

export function TableHeaderCell({ children, className = '' }: TableCellProps) {
  return (
    <th className={`py-3 px-4 text-left font-medium text-gray-700 border-b ${className}`}>
      {children}
    </th>
  );
} 