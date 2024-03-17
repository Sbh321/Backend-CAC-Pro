const asyncHandler = (requestHandler) => {
  (req, res, next) => {
    Promise.resolve(requestHandler(req, req, next)).catch((err) => next(err));
  };
};

export { asyncHandler };

//This below is a wrapper function
// const asyncHandler = (fn) => async (req, res, next) => {};

// OR

// const asyncHandler = (fn) => {
//   async (req, res, next) => {
//     try {
//     } catch (error) {
//       res.status(error.code || 500).json({
//         sucess: false,
//         message: error.message,
//       });
//     }
//   };
// };
