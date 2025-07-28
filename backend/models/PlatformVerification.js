import { supabaseAdmin } from '../utils/supabaseClient.js';

const TABLE_NAME = 'platform_verifications';

export async function createVerification(userId, platformId, profileUrl, verificationCode) {
    const { data, error } = await supabaseAdmin
        .from(TABLE_NAME)
        .insert([{
            user_id: userId,
            platform_id: platformId,
            profile_url: profileUrl,
            verification_code: verificationCode,
            verified: false,
            attempts: 0,
            created_at: new Date().toISOString()
        }]);

    if (error) {
        console.error('Error creating verification:', error);
        throw error;
    }

    return data;
}

export async function updateVerificationStatus(userId, platformId, verified) {
    const { data, error } = await supabaseAdmin
        .from(TABLE_NAME)
        .update({ 
            verified: verified,
            verified_at: verified ? new Date().toISOString() : null,
            last_attempt_at: new Date().toISOString(),
            attempts: supabaseAdmin.sql`attempts + 1`
        })
        .match({ 
            user_id: userId,
            platform_id: platformId
        });

    if (error) {
        console.error('Error updating verification status:', error);
        throw error;
    }

    return data;
}

export async function getVerification(userId, platformId) {
    const { data, error } = await supabaseAdmin
        .from(TABLE_NAME)
        .select('*')
        .match({ 
            user_id: userId,
            platform_id: platformId 
        })
        .single();

    if (error) {
        console.error('Error getting verification:', error);
        throw error;
    }

    return data;
}

export async function getAllVerifications(userId) {
    const { data, error } = await supabaseAdmin
        .from(TABLE_NAME)
        .select('*')
        .match({ user_id: userId });

    if (error) {
        console.error('Error getting verifications:', error);
        throw error;
    }

    return data;
}

export async function deleteVerification(userId, platformId) {
    const { data, error } = await supabaseAdmin
        .from(TABLE_NAME)
        .delete()
        .match({ 
            user_id: userId,
            platform_id: platformId 
        });

    if (error) {
        console.error('Error deleting verification:', error);
        throw error;
    }

    return data;
}
