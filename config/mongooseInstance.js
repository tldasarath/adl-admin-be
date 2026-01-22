
// import mongoose from 'mongoose';
// const mongooseInstance = mongoose;
// export default mongooseInstance;



import mongoose from 'mongoose';

// Ensure single instance
const mongooseInstance = mongoose;

// Prevent duplicate model registration helper
mongooseInstance.registerModel = function(modelName, schema, collectionName) {
  // Check if model already exists
  if (this.models[modelName]) {
    return this.models[modelName];
  }
  return this.model(modelName, schema, collectionName);
};

export default mongooseInstance;