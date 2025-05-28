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
    const type = req.query.type as string;

    const referenceText = "Consistency is the key to mastering any skill. Whether it's learning a new language, coding, or fitness, small daily efforts build lasting progress. Instead of waiting for motivation, create a routine that keeps you moving forward. Over time, these habits compound, leading to significant improvement. Even on tough days, showing up matters more than perfection.";
    const spokenText = "Consistency are the key to master any skill. Whether it's learning new language, coding or fitness, small daily effort builds lasting progress. Instead waiting for motivation, create routine that keeps you move forward. Over time, this habits compound, leading to big improvement. Even in tough days, showing up matter more than perfection.";
    
    
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
        //!uncomment this to use whisper
        // const transcription = await openai.audio.transcriptions.create({
        //   file: audioFile,
        //   model: "whisper-1",
        //   response_format: "verbose_json",
        //   language: "en"
        // });
        console.log('Whisper transcription completed');

        console.log('Starting GPT-4 analysis...');

        let systemMessage = "";
        let userMessage = "";

        if(type == 'intro'){
          // !uncomment this
          // systemMessage =  `You are an English language learning expert. Analyze the user's speech transcription based on their background. 
          // - Age: ${user.age} 
          // - Native language: ${user.nativeLanguage} 
          // - English level: ${user.englishProficiency}
          
          // Provide simple feedback tailored to their level. Rate grammar and speaking accuracy out of 10. Include clear and encouraging remarks in under 60 words.`;

          // userMessage = `Please analyze this speech transcription: "${transcription.text}"`;
        }else if(type == 'reading'){
          systemMessage = `You are an English language learning expert. Analyze the reading and provide feedback in the following JSON format:
          {
            "pronunciation_score": number (1-10),
            "fluency_score": number (1-10),
            "feedback": "Brief one-line summary of overall performance",
            "text_with_errors": {
              "full_text": "The complete spoken text",
              "errors": [
                {
                  "incorrect": "are",
                  "correction": "is",
                  "type": "verb_form",
                  "position": {
                    "start": 12,
                    "end": 15
                  },
                  "context": "Consistency are the key"
                },
                {
                  "incorrect": "master",
                  "correction": "mastering",
                  "type": "verb_form",
                  "position": {
                    "start": 24,
                    "end": 30
                  },
                  "context": "to master any skill"
                }
              ]
            },
            "areas_to_improve": {
              "articles": ["List of article errors"],
              "plurals": ["List of plural errors"],
              "verb_forms": ["List of verb form errors"],
              "word_choice": ["List of incorrect word choices"]
            },
            "key_errors": ["List of main errors in order of importance"]
          }

          Rules:
          - Keep feedback concise and direct
          - Avoid phrases like "The speaker..." or "The student..."
          - Use arrays for lists of errors
          - Focus on specific errors rather than general observations
          - Ensure response is valid JSON
          - Keep all text brief and to the point
          - For each error, provide exact character positions (start and end) in the text
          - Include a small context around each error for clarity
          - Provide a score for pronunciation and fluency out of 10
          - IMPORTANT: Ensure all JSON properties are properly closed
          - IMPORTANT: Return ONLY the JSON object, no additional text or formatting
          - IMPORTANT: Keep all strings properly quoted and terminated
          - IMPORTANT: Keep the response under 2000 characters to avoid truncation
          - IMPORTANT: Do not include any line breaks in string values`;
          
          
          

          userMessage = `Compare the following reference reading text with the transcribed speech.

            Reference:
            "${referenceText}"

            Transcription:
            "${spokenText}"`
        }

        console.log("systemMessage",systemMessage);
        console.log("userMessage",userMessage);
        
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
              content: systemMessage
            },
            {
              role: "user",
              content: userMessage
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        });
        console.log("analysis",typeof(analysis.choices[0].message.content));
        console.log('GPT-4 analysis completed');
        console.log("--------------------------------");
        
        // console.log("transcription",transcription);
        // console.log("--------------------------------");
        // console.log("transcription.segments",transcription.segments);
        console.log("--------------------------------");
        console.log("message from openai",analysis.choices[0].message);
        
        let response;
        // Format the response
        if(type == 'intro'){
          // !uncomment this
          // response = {
          //   transcription: transcription.text,
          //   analysis: analysis.choices[0].message.content,
          //   metrics: {
          //     segments: transcription.segments,
          //     duration: transcription.duration
          //   }
          // };
        }else if(type == 'reading'){
          try {
            // Parse the GPT response into a proper JSON structure
            const content = analysis.choices[0].message.content;
            if (!content) {
              throw new AppError('No analysis content received from GPT', 500);
            }
            const parsedAnalysis = JSON.parse(content);
            response = {
              pronunciation_score: parsedAnalysis.pronunciation_score,
              fluency_score: parsedAnalysis.fluency_score,
              feedback: parsedAnalysis.feedback,
              text_with_errors: parsedAnalysis.text_with_errors,
              areas_to_improve: parsedAnalysis.areas_to_improve,
              key_errors: parsedAnalysis.key_errors
            };
          } catch (parseError) {
            console.error('Error parsing GPT response:', parseError);
            throw new AppError('Error processing analysis results', 500);
          }
        }

        console.log("response",response);
        console.log("--------------------------------");

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
