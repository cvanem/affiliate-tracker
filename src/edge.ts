import axios from 'axios';
import { createRedirectEntry, type InsertableRedirect } from '../database';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSchedulingUrl } from './calendly';

// eventId: 3b0bfa02-8d78-4865-ad91-405744270db4
export default async function handler(req: VercelRequest, res: VercelResponse) {
    const platform = req.query.platform as string;
    const accountID = req.query.accountID as string;
    const eventID = req.query.eventID as string;  // Retrieve the eventID from the query
  
    console.log(`[Info] Received request for platform: ${platform}, accountID: ${accountID}, eventID: ${eventID}`);
  
    if (!platform || !accountID || !eventID) {
      return res.status(400).json({ error: 'Platform, accountID, and eventID are required.' });
    }
  
    // Record redirection in the database
    const redirectData: InsertableRedirect = {
      account_id: accountID,
      platform: platform,
    };
  
    await createRedirectEntry(redirectData);
    console.log('[Info] Redirect database entry created successfully');

    const token = process.env.BEARER_TOKEN;
    if (!token) {
        console.error('Bearer token not provided!');
        return res.status(500).json({ error: 'Internal server error' });
    }
  
    try {
        const calendlyUrl = await getSchedulingUrl(eventID, token);
        console.log('[Info] Generated Calendly URL:', calendlyUrl);
    } catch (error) {
        console.error('Error fetching Calendly URL:', error.message);
        return res.status(500).json({ error: 'Failed to generate Calendly URL' });
    }
  
    // Redirect user to the generated Calendly link
    res.writeHead(302, { Location: calendlyUrl });
    res.end();
}
  

export const config = {
  runtime: 'edge',
};

