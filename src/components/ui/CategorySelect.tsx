'use client'

import React from 'react'
import Select, { MultiValue, StylesConfig, components } from 'react-select'
import { Badge } from './Badge'
import { XMarkIcon } from '@heroicons/react/20/solid'

interface Category {
  id: string
  name: string
  description?: string
  parentId?: string
  children?: Category[]
}

interface CategorySelectProps {
  categories: Category[]
  selectedIds: string[]
  onSelectionChange: (selectedIds: string[]) => void
  placeholder?: string
  disabled?: boolean
  loading?: boolean
}

interface OptionType {
  value: string
  label: string
  level: number
  description?: string
  isParent: boolean
}

export function CategorySelect({
  categories,
  selectedIds,
  onSelectionChange,
  placeholder = "Add a category",
  disabled = false,
  loading = false
}: CategorySelectProps) {
  // Flatten categories with hierarchy info
  const flattenCategories = (categories: Category[], level = 0): OptionType[] => {
    let result: OptionType[] = []
    categories.forEach(category => {
      result.push({
        value: category.id,
        label: category.name,
        level,
        description: category.description,
        isParent: level === 0
      })
      if (category.children && category.children.length > 0) {
        result = result.concat(flattenCategories(category.children, level + 1))
      }
    })
    return result
  }

  const options = flattenCategories(categories)
  const selectedOptions = options.filter(option => selectedIds.includes(option.value))

  const handleChange = (selectedOptions: MultiValue<OptionType>) => {
    const selectedIds = selectedOptions.map(option => option.value)
    onSelectionChange(selectedIds)
  }

  const handleRemoveCategory = (categoryId: string) => {
    onSelectionChange(selectedIds.filter(id => id !== categoryId))
  }

  // Custom styles for React Select
  const customStyles: StylesConfig<OptionType, true> = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '48px',
      border: '1px solid #cbd5e1',
      borderRadius: '12px',
      boxShadow: state.isFocused ? '0 0 0 2px #3b82f6' : 'none',
      '&:hover': {
        border: '1px solid #94a3b8'
      }
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? '#dbeafe' 
        : state.isFocused 
          ? '#f1f5f9' 
          : 'white',
      color: state.isSelected ? '#1e40af' : '#1e293b',
      padding: '12px 16px',
      borderBottom: '1px solid #f1f5f9',
      '&:last-child': {
        borderBottom: 'none'
      }
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#f1f5f9',
      borderRadius: '8px',
      padding: '2px'
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: '#475569',
      fontSize: '14px',
      fontWeight: '500'
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: '#64748b',
      '&:hover': {
        backgroundColor: '#fca5a5',
        color: '#dc2626'
      }
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#64748b',
      fontSize: '14px'
    }),
    noOptionsMessage: (provided) => ({
      ...provided,
      color: '#64748b',
      fontSize: '14px',
      padding: '16px'
    })
  }

  // Custom option component to show hierarchy
  const Option = (props: any) => {
    const { data, isSelected, isFocused } = props
    return (
      <components.Option {...props}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 border-2 rounded flex items-center justify-center flex-shrink-0 ${
              isSelected
                ? 'border-blue-500 bg-blue-500'
                : 'border-slate-300 bg-white'
            }`}>
              {isSelected && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="flex flex-col">
              <span className={`${
                data.isParent ? 'font-semibold' : 'font-normal'
              } ${isFocused ? 'text-blue-900' : isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                {data.level > 0 && (
                  <span className="text-slate-400 mr-2">
                    {'└─ '}
                  </span>
                )}
                {data.label}
              </span>
              {data.description && (
                <span className={`text-xs mt-0.5 ${
                  isFocused ? 'text-blue-600' : isSelected ? 'text-blue-600' : 'text-slate-500'
                }`}>
                  {data.description}
                </span>
              )}
            </div>
          </div>
          {data.level > 0 && (
            <span className={`text-xs px-2 py-1 rounded ${
              isFocused ? 'bg-blue-100 text-blue-700' : isSelected ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
            }`}>
              Sub
            </span>
          )}
        </div>
      </components.Option>
    )
  }

  if (loading) {
    return (
      <div className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-slate-50 flex items-center space-x-2">
        <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
        <span className="text-slate-500">Loading categories...</span>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Selected Categories Display */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedOptions.map((option) => (
            <Badge
              key={option.value}
              variant="secondary"
              className="flex items-center space-x-1 px-3 py-1"
            >
              <span className={option.level > 0 ? 'text-xs' : 'text-sm'}>
                {option.level > 0 && '└─ '}
                {option.label}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveCategory(option.value)}
                className="ml-1 hover:text-red-500 transition-colors"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* React Select */}
      <Select
        options={options}
        value={selectedOptions}
        onChange={handleChange}
        isMulti
        isDisabled={disabled || categories.length === 0}
        placeholder={categories.length === 0 ? 'No categories available' : placeholder}
        styles={customStyles}
        components={{ Option }}
        isSearchable
        isClearable={false}
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        noOptionsMessage={() => "No categories found"}
        loadingMessage={() => "Loading categories..."}
      />
    </div>
  )
}
