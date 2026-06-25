import mongoose from 'mongoose';

import { User } from '../models/User.js';
import { Events } from '../models/Events.js';

export const createEvent = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({ message: 'Request body is empty' });
        }

        let { title, description, event_start, event_end, location } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!title || title.trim() === '') {
            return res.status(400).json({ message: 'Title is required' });
        }

        const eventStartDate = new Date(event_start);
        const eventEndDate = new Date(event_end);

        if (!event_start || isNaN(eventStartDate.getTime())) {
            return res.status(400).json({
                message: "Invalid event start date format"
            });
        }

        if (event_end && isNaN(eventEndDate.getTime())) {
            return res.status(400).json({
                message: "Invalid event end date format"
            });
        }

        if (event_end && eventStartDate > eventEndDate) {
            return res.status(400).json({
                message: "Event start date cannot be after event end date"
            });
        }

        const event = await Events.create({
            user: user._id,
            title,
            description: description || 'N/A',
            event_start: eventStartDate,
            event_end: event_end ? eventEndDate : null,
            location: location || 'N/A',
        });

        res.status(201).json({ message: 'Event created successfully', event });

    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const getEvents = async (req, res) => {
    try {
        if (!req.query) {
            return res.status(400).json({ message: 'Query parameters are required' });

        }
        const { page = 1, limit = 10 } = req.query;

        const events = await Events.find({ user: req.user.id })
            .sort({ event_start: 1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .lean();

        res.status(200).json({ count: events.length, events });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const getEventById = async (req, res) => {
    try {
        if (!req.params || !req.params.id || mongoose.Types.ObjectId.isValid(req.params.id) === false) {
            return res.status(400).json({ message: 'Invalid event ID' });
        }

        const event = await Events.findOne({ _id: req.params.id, user: req.user.id });
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.status(200).json({ event });
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const deleteEvent = async (req, res) => {
    try {

        if (!req.params || !req.params.id || mongoose.Types.ObjectId.isValid(req.params.id) === false) {
            return res.status(400).json({ message: 'Invalid event ID' });
        }

        const event = await Events.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const updateEvent = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!req.params || !req.params.id || mongoose.Types.ObjectId.isValid(req.params.id) === false) {
            return res.status(400).json({ message: 'Invalid event ID' });
        }

        if (!req.body) {
            return res.status(400).json({ message: 'Request body is empty' });
        }

        const updates = {};

        const allowedFields = [
            'title',
            'description',
            'event_start',
            'event_end',
            'location'
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        const event = await Events.findOneAndUpdate(
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

        if (!event) {
            return res.status(404).json({
                message: 'Event not found'
            });
        }

        res.status(200).json({
            message: 'Event updated successfully',
            event
        });
    } catch (error) {
        console.error('Error updating event:', error);

        res.status(500).json({
            message: 'Internal server error'
        });
    }
};