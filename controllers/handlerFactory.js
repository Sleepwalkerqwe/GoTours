const AppError = require(`./../utils/appError`);
const catchAsync = require(`./../utils/catchAsync`);
const APIFeatures = require(`./../utils/apiFeatures`);

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    await Model.findByIdAndDelete(req.params.id);
    res.status(200).json({
      status: 'success',
      message: `document with id ${req.params.id} was deleted`,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

//
exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);

    const doc = await query;

    if (!doc) {
      return next(new AppError('No document find with that Id.', 404));
    }
    res.status(200).json({
      status: 'success',
      data: { doc },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // To allow for nested GET reviews on tour
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    // Execute query     // query.sort().select().skip().limit()
    const features = new APIFeatures(Model.find(), req.query).filter().sort().limit().paginate();

    // 67924aa258aa4a3fc47155e4
    const doc = await features.query.explain();
    // Send response
    res.status(200).json({
      status: 'success',
      requstedAt: req.requestTime,
      // result: doc.length,
      // data: { data: doc },
      //
      // await Model.find()
      result: (await Model.find()).length,
      data: { data: await Model.find() },
    });
  });
