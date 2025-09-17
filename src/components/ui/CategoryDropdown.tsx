'use client'

import React, { useState, Fragment } from 'react'
import { Combobox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon, XMarkIcon, TagIcon } from '@heroicons/react/20/solid'
import { Badge } from './Badge'

interface Category {
  id: string
  name: string
  description?: string
  parentId?: string
  children?: Category[]
}

interface CategoryDropdownProps {
  categories: Category[]
  selectedIds: string[]
  onSelectionChange: (selectedIds: string[]) => void
  placeholder?: string
  disabled?: boolean
  loading?: boolean
}

export function CategoryDropdown({
  categories,
  selectedIds,
  onSelectionChange,
  placeholder = "Add a category",
  disabled = false,
  loading = false
}: CategoryDropdownProps) {
  const [query, setQuery] = useState('')

  // Flatten categories with hierarchy info
  const flattenCategories = (categories: Category[], level = 0): Array<Category & { level: number; displayName: string }> => {
    let result: Array<Category & { level: number; displayName: string }> = []
    categories.forEach(category => {
      result.push({
        ...category,
        level,
        displayName: '  '.repeat(level) + category.name
      })
      if (category.children && category.children.length > 0) {
        result = result.concat(flattenCategories(category.children, level + 1))
      }
    })
    return result
  }

  const flatCategories = flattenCategories(categories)
  const selectedCategories = flatCategories.filter(cat => selectedIds.includes(cat.id))

  const filteredCategories = query === ''
    ? flatCategories
    : flatCategories.filter((category) =>
        category.name.toLowerCase().includes(query.toLowerCase())
      )

  const handleToggleCategory = (categoryId: string) => {
    if (selectedIds.includes(categoryId)) {
      onSelectionChange(selectedIds.filter(id => id !== categoryId))
    } else {
      onSelectionChange([...selectedIds, categoryId])
    }
  }

  const handleRemoveCategory = (categoryId: string) => {
    onSelectionChange(selectedIds.filter(id => id !== categoryId))
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
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedCategories.map((category) => (
            <Badge
              key={category.id}
              variant="secondary"
              className="flex items-center space-x-1 px-3 py-1"
            >
              <span className={category.level > 0 ? 'text-xs' : 'text-sm'}>
                {category.level > 0 && '└─ '}
                {category.name}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveCategory(category.id)}
                className="ml-1 hover:text-red-500 transition-colors"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Headless UI Combobox */}
      <Combobox
        value={null}
        onChange={(category) => {
          if (category && !selectedIds.includes(category.id)) {
            handleToggleCategory(category.id)
          }
        }}
        disabled={disabled || categories.length === 0}
      >
        <div className="relative">
          <div className="relative w-full cursor-default overflow-hidden rounded-xl bg-white text-left shadow-sm border border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-500 sm:text-sm">
            <Combobox.Input
              className="w-full border-none py-3 pl-4 pr-10 text-sm leading-5 text-slate-900 focus:ring-0"
              displayValue={() => ''}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={categories.length === 0 ? 'No categories available' : placeholder}
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-slate-400"
                aria-hidden="true"
              />
            </Combobox.Button>
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery('')}
          >
            <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {filteredCategories.length === 0 && query !== '' ? (
                <div className="relative cursor-default select-none py-2 px-4 text-slate-700">
                  Nothing found.
                </div>
              ) : (
                filteredCategories.map((category) => (
                  <Combobox.Option
                    key={category.id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-3 px-4 ${
                        active ? 'bg-primary-500 text-white' : 'text-slate-900'
                      } ${selectedIds.includes(category.id) ? 'bg-primary-50 text-primary-900' : ''}`
                    }
                    value={category}
                  >
                    {({ selected, active }) => (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 border-2 rounded flex items-center justify-center flex-shrink-0 ${
                            selectedIds.includes(category.id)
                              ? 'border-primary-500 bg-primary-500'
                              : 'border-slate-300 bg-white'
                          }`}>
                            {selectedIds.includes(category.id) && (
                              <CheckIcon className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className={`${
                              category.level === 0 ? 'font-medium' : 'font-normal'
                            } ${active ? 'text-white' : 'text-slate-900'}`}>
                              {category.level > 0 && (
                                <span className="text-slate-400 mr-2">
                                  {'└─ '}
                                </span>
                              )}
                              {category.name}
                            </span>
                            {category.description && (
                              <span className={`text-xs mt-0.5 ${
                                active ? 'text-primary-100' : 'text-slate-500'
                              }`}>
                                {category.description}
                              </span>
                            )}
                          </div>
                        </div>
                        {category.level > 0 && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            active ? 'bg-primary-400 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            Sub
                          </span>
                        )}
                      </div>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
    </div>
  )
}