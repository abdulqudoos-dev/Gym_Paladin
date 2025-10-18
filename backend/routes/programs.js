const express = require('express');
const router = express.Router();
const Program = require('../models/Program');

// GET /api/programs - Get all programs
router.get('/', async (req, res) => {
  try {
    const programs = await Program.find()
      .populate('days.workouts.workoutId', 'title description exercises')
      .sort({ createdAt: -1 });
    res.json(programs);
  } catch (error) {
    console.error('Error fetching programs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/programs/:id - Get single program
router.get('/:id', async (req, res) => {
  try {
    const program = await Program.findById(req.params.id)
      .populate('days.workouts.workoutId', 'title description exercises difficulty duration');
    if (!program) {
      return res.status(404).json({ success: false, message: 'Program not found' });
    }
    res.json({ success: true, program });
  } catch (error) {
    console.error('Error fetching program:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/programs - Create new program
router.post('/', async (req, res) => {
  try {
    console.log('Received program data:', JSON.stringify(req.body, null, 2));
    const program = new Program(req.body);
    await program.save();
    res.status(201).json(program);
  } catch (error) {
    console.error('Error creating program:', error);
    res.status(400).json({ message: 'Invalid program data' });
  }
});

// PUT /api/programs/:id - Update program
router.put('/:id', async (req, res) => {
  try {
    const program = await Program.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('days.workouts.workoutId', 'title description exercises');
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }
    res.json(program);
  } catch (error) {
    console.error('Error updating program:', error);
    res.status(400).json({ message: 'Invalid program data' });
  }
});

// DELETE /api/programs/:id - Delete program
router.delete('/:id', async (req, res) => {
  try {
    const program = await Program.findByIdAndDelete(req.params.id);
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }
    res.json({ message: 'Program deleted successfully' });
  } catch (error) {
    console.error('Error deleting program:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
