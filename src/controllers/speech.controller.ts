import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import OpenAI from 'openai';
import fs from 'fs';
import dotenv from 'dotenv';
import { User } from '../models/User';


dotenv.config();

if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3,
  timeout: 120000, // 2 minutes timeout
});

export class SpeechController {
  static async analyzeSpeech(req: Request, res: Response, next: NextFunction) {
    let filePath: string | null = null;
    
    try {
      // Get user from database
      const user = await User.findById(req.user?.userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (!req.file) {
        throw new AppError('No audio file provided', 400);
      }

      filePath = req.file.path;

      // Verify file exists and is readable
      if (!fs.existsSync(filePath)) {
        throw new AppError('Uploaded file not found', 400);
      }

      const fileStats = fs.statSync(filePath);
      console.log('Processing file:', {
        path: filePath,
        size: fileStats.size,
        mimetype: req.file.mimetype
      });

      // Check file size (25MB limit)
      if (fileStats.size > 25 * 1024 * 1024) {
        throw new AppError('File size exceeds 25MB limit', 400);
      }

      // Read the audio file
      const audioFile = fs.createReadStream(filePath);

      try {
        console.log('Starting Whisper transcription...');
        // Transcribe audio using Whisper
        const transcription = await openai.audio.transcriptions.create({
          file: audioFile,
          model: "whisper-1",
          response_format: "verbose_json",
          language: "en"
        });
        console.log('Whisper transcription completed');

        console.log('Starting GPT-4 analysis...');
        // Analyze the transcription using GPT-4
        const analysis = await openai.chat.completions.create({
          model: "gpt-4",
          // messages: [
          //   {
          //     role: "system",
          //     content: "You are an English language learning expert. Analyze the following speech transcription and provide detailed feedback on grammar, and speaking accuracy. Rate each aspect out of 10 and provide specific remarks. Keep the remarks under 60 words."
          //   },
          //   {
          //     role: "user",
          //     content: `Please analyze this speech transcription: "${transcription.text}"`
          //   }
          // ],
          messages: [
            {
              role: "system",
              content: `You are an English language learning expert. Analyze the user's speech transcription based on their background. 
              - Age: ${user.age} 
              - Native language: ${user.nativeLanguage} 
              - English level: ${user.englishProficiency}
              
              Provide simple feedback tailored to their level. Rate grammar and speaking accuracy out of 10. Include clear and encouraging remarks in under 60 words.`
            },
            {
              role: "user",
              content: `Please analyze this speech transcription: "${transcription.text}"`
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        });
        console.log('GPT-4 analysis completed');
        console.log("--------------------------------");
        
        console.log("transcription",transcription);
        console.log("--------------------------------");
        console.log("transcription.segments",transcription.segments);
        console.log("--------------------------------");
        console.log("message from openai",analysis.choices[0].message);
        
        
        // Format the response
        const response = {
          transcription: transcription.text,
          analysis: analysis.choices[0].message.content,
          metrics: {
            segments: transcription.segments,
            duration: transcription.duration
          }
        };

        res.status(200).json(response);
      } catch (openaiError: any) {
        console.error('OpenAI API Error Details:', {
          name: openaiError.name,
          message: openaiError.message,
          code: openaiError.code,
          status: openaiError.status,
          stack: openaiError.stack
        });

        if (openaiError.code === 'ECONNRESET') {
          throw new AppError('Connection to OpenAI API failed. Please check your internet connection and try again.', 503);
        } else if (openaiError.status === 429) {
          throw new AppError('OpenAI API rate limit exceeded. Please try again later.', 429);
        } else if (openaiError.status === 401) {
          throw new AppError('OpenAI API authentication failed. Please check API key.', 401);
        } else if (openaiError.message?.includes('timeout')) {
          throw new AppError('Request timed out. The audio file might be too large. Please try with a shorter recording.', 408);
        } else {
          throw new AppError(`Error processing audio: ${openaiError.message || 'Unknown error'}`, 500);
        }
      }
    } catch (error) {
      console.error('Controller Error:', error);
      next(error);
    } finally {
      // Clean up the file if it exists
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log('Temporary file cleaned up successfully');
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
      }
    }
  }
}
