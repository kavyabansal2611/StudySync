import mongoose from 'mongoose';

import { User } from '../models/User.js';
import { Task } from '../models/Tasks.js';

export const createTask = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({ message: 'Request body is empty' });
        }

        let { title, description, deadline, priority } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!title || title.trim() === '') {
            return res.status(400).json({ message: 'Title is required' });
        }

        const deadlineDate = new Date(deadline);
        if (!deadline || isNaN(deadlineDate.getTime())) {
            return res.status(400).json({
                message: "Invalid deadline format"
            });
        }

        if (deadlineDate < new Date()) {
            return res.status(400).json({ message: 'Deadline must be a future date' });
        }

        const priorityNumber = Number(priority);
        if (
            Number.isNaN(priorityNumber) ||
            priorityNumber < 1 ||
            priorityNumber > 10
        ) {
            return res.status(400).json({
                message: "Priority must be a number between 1 and 10"
            });
        }

        const task = await Task.create({
            user: user._id,
            title,
            description: description || 'N/A',
            deadline: deadlineDate,
            priority: priorityNumber,
        });

        res.status(201).json({ message: 'Task created successfully', task });

    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const getTasks = async (req, res) => {
    try {
        if (!req.query) {
            return res.status(400).json({ message: 'Query parameters are required' });

        }
        const { page = 1, limit = 10 } = req.query;

        const tasks = await Task.find({ user: req.user.id })
            .sort({ deadline: 1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .lean();

        res.status(200).json({ count: tasks.length, tasks });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const getTaskById = async (req, res) => {
    try {
        if (!req.params || !req.params.id || mongoose.Types.ObjectId.isValid(req.params.id) === false) {
            return res.status(400).json({ message: 'Invalid task ID' });
        }

        const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.status(200).json({ task });
    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const deleteTask = async (req, res) => {
    try {

        if (!req.params || !req.params.id || mongoose.Types.ObjectId.isValid(req.params.id) === false) {
            return res.status(400).json({ message: 'Invalid task ID' });
        }

        const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const updateTask = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!req.params || !req.params.id || mongoose.Types.ObjectId.isValid(req.params.id) === false) {
            return res.status(400).json({ message: 'Invalid task ID' });
        }

        if (!req.body) {
            return res.status(400).json({ message: 'Request body is empty' });
        }

        const updates = {};

        const allowedFields = [
            'title',
            'description',
            'deadline',
            'status',
            'priority'
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        const task = await Task.findOneAndUpdate(
            {
                _id: req.params.id,
                user: req.user.id
            },
            { $set: updates },
            {
                returnDocument: "after",
                runValidators: true
            }
        );

        if (!task) {
            return res.status(404).json({
                message: 'Task not found'
            });
        }

        res.status(200).json({
            message: 'Task updated successfully',
            task
        });
    } catch (error) {
        console.error('Error updating task:', error);

        res.status(500).json({
            message: 'Internal server error'
        });
    }
};