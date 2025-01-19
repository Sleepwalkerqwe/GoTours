const Tour = require(`../models/tourModel`);
const AppError = require(`./../utils/appError`);
const catchAsync = require(`./../utils/catchAsync`);

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndDelete(req.params.id);
    if (!document) {
      return next(new AppError('No document found with that ID', 404));
    }

    await Model.findByIdAndDelete(req.params.id);
    res.status(200).json({
      status: 'success',
      message: `document with id ${req.params.id} was deleted`,
    });
  });

exports.updateOne = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});
