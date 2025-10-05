import Joi from 'joi';

export const productCreateSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.empty': 'Product name cannot be empty',
      'string.max': 'Product name cannot exceed 255 characters',
      'any.required': 'Product name is required'
    }),
  
  description: Joi.string()
    .max(2000)
    .allow('', null)
    .messages({
      'string.max': 'Description cannot exceed 2000 characters'
    }),
  
  price: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.positive': 'Price must be greater than 0',
      'any.required': 'Price is required'
    }),
  
  quantity: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.min': 'Quantity cannot be negative',
      'number.integer': 'Quantity must be a whole number',
      'any.required': 'Quantity is required'
    }),
  
  category: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Category cannot be empty',
      'string.max': 'Category cannot exceed 100 characters',
      'any.required': 'Category is required'
    })
});

export const productUpdateSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(255)
    .messages({
      'string.empty': 'Product name cannot be empty',
      'string.max': 'Product name cannot exceed 255 characters'
    }),
  
  description: Joi.string()
    .max(2000)
    .allow('', null)
    .messages({
      'string.max': 'Description cannot exceed 2000 characters'
    }),
  
  price: Joi.number()
    .positive()
    .precision(2)
    .messages({
      'number.positive': 'Price must be greater than 0'
    }),
  
  quantity: Joi.number()
    .integer()
    .min(0)
    .messages({
      'number.min': 'Quantity cannot be negative',
      'number.integer': 'Quantity must be a whole number'
    }),
  
  category: Joi.string()
    .min(1)
    .max(100)
    .messages({
      'string.empty': 'Category cannot be empty',
      'string.max': 'Category cannot exceed 100 characters'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

export const productQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.min': 'Page must be at least 1',
      'number.integer': 'Page must be a whole number'
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100',
      'number.integer': 'Limit must be a whole number'
    }),
  
  category: Joi.string()
    .allow('')
    .max(100)
    .messages({
      'string.max': 'Category filter cannot exceed 100 characters'
    }),
  
  min_quantity: Joi.number()
    .integer()
    .min(0)
    .messages({
      'number.min': 'Minimum quantity cannot be negative',
      'number.integer': 'Minimum quantity must be a whole number'
    }),
  
  max_quantity: Joi.number()
    .integer()
    .min(0)
    .messages({
      'number.min': 'Maximum quantity cannot be negative',
      'number.integer': 'Maximum quantity must be a whole number'
    }),
  
  sort_by: Joi.string()
    .valid('name', 'price', 'quantity', 'created_at', 'updated_at')
    .default('created_at')
    .messages({
      'any.only': 'Sort field must be one of: name, price, quantity, created_at, updated_at'
    }),
  
  sort_order: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': 'Sort order must be either "asc" or "desc"'
    })
});
