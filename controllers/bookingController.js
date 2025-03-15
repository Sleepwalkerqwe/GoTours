const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const User = require('../models/userModel');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  // 2) Create checkout session
  let session;
  if (tour.price == 0) {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${req.protocol}://${req.get('host')}/my-tours`,
      cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
      customer_email: req.user.email,
      client_reference_id: req.params.tourId,

      line_items: [
        {
          price_data: {
            unit_amount: 0,
            product_data: {
              name: `${tour.name} Tour`,
              description: tour.summary,
              images: [`${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`],
            },
            currency: 'usd',
          },
          quantity: 1,
        },
      ],
    });
    console.log('if srabotal');
  } else {
    session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      success_url: `${req.protocol}://${req.get('host')}/my-tours`,
      cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
      customer_email: req.user.email,
      client_reference_id: req.params.tourId, //this field allows us to pass in some data about this session that we are currently creating.

      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: tour.price * 100,
            product_data: {
              name: `${tour.name} Tour`,
              description: tour.summary,
              images: [`${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`],
            },
          },
        },
      ],
    });
  }

  // 3) Create session as response
  console.log('getCheckOutSession done');
  res.status(200).json({
    status: 'success',
    session,
  });
});

const createBookingCheckout = async (session) => {
  console.log('create booking checkout in progress');
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.amount_total ? session.amount_total / 100 : 0;
  console.log('creating booking checkout');
  await Booking.create({ tour, user, price });
};

exports.webhookCheckout = (req, res, next) => {
  console.log('Webhook checkout is on process');
  console.log('Headers:', req.headers);
  console.log('Raw Body:', req.body); // Должен быть Buffer

  const signature = req.headers['stripe-signature'];
  console.log('Stripe Signature:', signature); // Должно быть строкой

  if (!signature) {
    console.log('❌ Ошибка: Stripe-Signature отсутствует!');
    return res.status(400).send('Webhook error: Missing Stripe signature');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    console.log('✅ Webhook успешно обработан!', event);
  } catch (err) {
    console.log('❌ Webhook error:', err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    createBookingCheckout(event.data.object);
  }

  res.status(200).json({ received: true });
};

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
