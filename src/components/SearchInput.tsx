import React from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

interface SearchInputProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  className?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Buscar...',
  onSearch,
  className = '',
}) => {
  return (
    <Input
      placeholder={placeholder}
      prefix={<SearchOutlined className="text-gray-400" />}
      onChange={(e) => onSearch(e.target.value)}
      className={`w-full rounded-md border-gray-300 focus:border-blue-500 ${className}`}
      allowClear
      aria-label={placeholder}
    />
  );
};

export default SearchInput;