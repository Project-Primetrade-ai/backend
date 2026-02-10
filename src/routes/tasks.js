const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res, next) => {
  const { search, status } = req.query;

  const query = { user: req.user.id };

  if (status) {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  try {
    const tasks = await Task.find(query).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  auth,
  [body('title').notEmpty().withMessage('Title is required')],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, status } = req.body;

    try {
      const task = new Task({
        user: req.user.id,
        title,
        description,
        status,
      });

      await task.save();

      res.status(201).json(task);
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/:id',
  auth,
  [
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('status')
      .optional()
      .isIn(['pending', 'in-progress', 'completed'])
      .withMessage('Invalid status'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, status } = req.body;

    try {
      const updates = {};
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (status !== undefined) updates.status = status;

      const task = await Task.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id },
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      res.json(task);
    } catch (err) {
      next(err);
    }
  }
);

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

