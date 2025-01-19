const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');
const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(authController.protect, reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('guide'),
    reviewController.setTourUserIds,
    reviewController.createReview,
  );

router
  .route('/:id')
  .get(authController.protect, reviewController.getReview)
  .patch(reviewController.updateReview)
  .delete(authController.protect, reviewController.deleteReview);

module.exports = router;
// populate two fields
