import axios from 'axios';
import * as cheerio from 'cheerio';

// LeetCode profile verification
async function verifyLeetCode(profileUrl, verificationCode) {
    try {
        // Extract username from URL
        let username = profileUrl.trim();
        
        // Handle both old and new URL formats
        // New format: leetcode.com/u/username
        // Old format: leetcode.com/username
        const urlParts = username.split('/');
        username = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
        
        if (!username) {
            console.error('Could not extract username from URL:', profileUrl);
            return false;
        }

        console.log('Attempting to verify LeetCode profile:', {
            originalUrl: profileUrl,
            extractedUsername: username,
            verificationCode: verificationCode
        });

        // GraphQL query to get user profile
        const graphqlQuery = {
            query: `
                query getUserProfile($username: String!) {
                    matchedUser(username: $username) {
                        username
                        profile {
                            realName
                        }
                    }
                }
            `,
            variables: {
                username: username
            }
        };

        // Make the GraphQL request
        const response = await axios({
            url: 'https://leetcode.com/graphql',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0',
                'Origin': 'https://leetcode.com',
                'Referer': `https://leetcode.com/${username}`
            },
            data: graphqlQuery
        });

        console.log('LeetCode API Response:', {
            status: response.status,
            hasData: !!response.data,
            dataPath: 'data.data.matchedUser'
        });

        const userData = response.data.data.matchedUser;
        if (!userData) {
            console.error('LeetCode user not found:', username);
            return false;
        }

        // Get user's real name from profile
        const realName = userData.profile.realName;

        console.log('Profile data found:', {
            username: userData.username,
            realName: realName,
            verificationCode: verificationCode,
            matches: realName === verificationCode
        });

        // Check if the real name matches the verification code exactly
        return realName === verificationCode;
    } catch (error) {
        console.error('LeetCode verification error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        return false;
    }
}

// CodeForces profile verification
async function verifyCodeforces(profileUrl, verificationCode) {
    try {
        const username = profileUrl.split('/').pop().toLowerCase();
        const response = await axios.get(`https://codeforces.com/api/user.info?handles=${username}`);
        
        if (!response.data.result || response.data.result.length === 0) {
            console.error('Codeforces user not found');
            return false;
        }

        const userData = response.data.result[0];
        const handle = userData.handle;
        const firstName = userData.firstName || '';
        const lastName = userData.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();

        return handle.toLowerCase() === verificationCode.toLowerCase() || 
               fullName === verificationCode;
    } catch (error) {
        console.error('Codeforces verification error:', error);
        return false;
    }
}

// GeeksForGeeks profile verification
async function verifyGFG(profileUrl, verificationCode) {
    try {
        // Extract username from GFG URL
        const username = profileUrl.split('/').pop().toLowerCase();
        const response = await axios.get(`https://api.geeksforgeeks.org/api/users/${username}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });

        if (!response.data || !response.data.user) {
            console.error('GFG user not found');
            return false;
        }

        const handle = response.data.user.handle;
        const name = response.data.user.name;

        return handle.toLowerCase() === verificationCode.toLowerCase() || 
               name === verificationCode;
    } catch (error) {
        console.error('GFG verification error:', error);
        return false;
    }
}

// CodeChef profile verification
async function verifyCodeChef(profileUrl, verificationCode) {
    try {
        const username = profileUrl.split('/').pop().toLowerCase();
        // CodeChef API requires authentication, so we'll use a more basic approach
        const response = await axios.get(`https://www.codechef.com/users/${username}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });

        // Check if username matches (case insensitive)
        // For CodeChef, we'll primarily verify through the username
        return username === verificationCode.toLowerCase();
    } catch (error) {
        console.error('CodeChef verification error:', error);
        return false;
    }
}

// HackerRank profile verification
async function verifyHackerRank(profileUrl, verificationCode) {
    try {
        const username = profileUrl.split('/').pop().toLowerCase();
        const response = await axios.get(`https://www.hackerrank.com/rest/hackers/${username}/profile`, {
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });

        if (!response.data || !response.data.model) {
            console.error('HackerRank user not found');
            return false;
        }

        const handle = response.data.model.username;
        const name = response.data.model.name || '';

        return handle.toLowerCase() === verificationCode.toLowerCase() || 
               name === verificationCode;
    } catch (error) {
        console.error('HackerRank verification error:', error);
        return false;
    }
}

export async function verifyPlatform(platformId, profileUrl, verificationCode) {
    switch (platformId) {
        case 'leetcode':
            return await verifyLeetCode(profileUrl, verificationCode);
        case 'codeforces':
            return await verifyCodeforces(profileUrl, verificationCode);
        case 'gfg':
            return await verifyGFG(profileUrl, verificationCode);
        case 'codechef':
            return await verifyCodeChef(profileUrl, verificationCode);
        case 'hackerrank':
            return await verifyHackerRank(profileUrl, verificationCode);
        default:
            throw new Error('Unsupported platform');
    }
}
