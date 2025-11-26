export const validateEventData = (data, isUpdate = false) => {
  const errors = [];
  
  // Helper function to validate required fields
  const validateRequired = (field, value, message) => {
    if (!isUpdate && !value) {
      errors.push({ field, message });
    }
  };

  // Validate title
  if (data.title !== undefined) {
    if (typeof data.title !== 'string' || data.title.trim().length === 0) {
      errors.push({ field: 'title', message: 'Title is required' });
    } else if (data.title.length > 200) {
      errors.push({ field: 'title', message: 'Title must be at most 200 characters' });
    }
  }
  validateRequired('title', data.title, 'Title is required');

  // Validate description
  if (data.description !== undefined) {
    if (typeof data.description !== 'string' || data.description.trim().length === 0) {
      errors.push({ field: 'description', message: 'Description is required' });
    } else if (data.description.length > 2000) {
      errors.push({ field: 'description', message: 'Description must be at most 2000 characters' });
    }
  }
  validateRequired('description', data.description, 'Description is required');

  // Validate location
  if (data.location !== undefined) {
    if (typeof data.location !== 'string' || data.location.trim().length === 0) {
      errors.push({ field: 'location', message: 'Location is required' });
    }
  }
  validateRequired('location', data.location, 'Location is required');

  // Validate dates
  if (data.start_date !== undefined) {
    const startDate = new Date(data.start_date);
    if (isNaN(startDate.getTime())) {
      errors.push({ field: 'start_date', message: 'Invalid start date' });
    } else if (startDate < new Date()) {
      errors.push({ field: 'start_date', message: 'Start date must be in the future' });
    }
  }
  validateRequired('start_date', data.start_date, 'Start date is required');

  if (data.end_date !== undefined) {
    const endDate = new Date(data.end_date);
    if (isNaN(endDate.getTime())) {
      errors.push({ field: 'end_date', message: 'Invalid end date' });
    } else if (data.start_date && endDate <= new Date(data.start_date)) {
      errors.push({ field: 'end_date', message: 'End date must be after start date' });
    }
  }
  validateRequired('end_date', data.end_date, 'End date is required');

  // Validate price
  if (data.price !== undefined) {
    if (typeof data.price !== 'number' || data.price < 0) {
      errors.push({ field: 'price', message: 'Price must be a positive number' });
    }
  }
  validateRequired('price', data.price, 'Price is required');

  // Validate capacity
  if (data.capacity !== undefined) {
    if (!Number.isInteger(data.capacity) || data.capacity < 1) {
      errors.push({ field: 'capacity', message: 'Capacity must be a positive integer' });
    }
  }
  validateRequired('capacity', data.capacity, 'Capacity is required');

  return {
    isValid: errors.length === 0,
    errors
  };
};