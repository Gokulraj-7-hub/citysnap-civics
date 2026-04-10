// Hugging Face AI Service for Image Analysis
const HF_API_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY;

// Use Netlify serverless function in production, direct proxy in local dev
// Netlify serverless function URL
const HF_CLASSIFY_URL = "/.netlify/functions/hf-classify";

// Convert file to base64 string
async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Map ImageNet labels → civic issue categories
const CIVIC_LABEL_MAP = [
    {
        keywords: ['pothole', 'manhole', 'pavement', 'road', 'asphalt', 'concrete', 'rubble', 'gravel', 'sand', 'soil'],
        issue: {
            title: 'Road Damage - Pothole / Surface Deterioration',
            description: 'Road surface damage detected. Visible deterioration, pothole, or cracking poses a safety hazard to vehicles and pedestrians. Requires immediate attention to prevent accidents and further damage.',
            severity: 'High - Safety Hazard',
            action: 'Road repair and resurfacing required'
        }
    },
    {
        keywords: ['waste', 'garbage', 'trash', 'litter', 'refuse', 'dumpster', 'bin', 'landfill', 'junk', 'debris'],
        issue: {
            title: 'Waste Management Issue - Garbage Accumulation',
            description: 'Improper waste disposal or garbage accumulation detected. Trash or waste materials need to be cleared to address health hazards and environmental concerns.',
            severity: 'Medium - Health & Sanitation Concern',
            action: 'Waste collection and area cleaning required'
        }
    },
    {
        keywords: ['streetlight', 'lamp', 'lantern', 'torch', 'bulb', 'spotlight', 'pole', 'electric', 'wiring', 'cable'],
        issue: {
            title: 'Street Lighting Issue',
            description: 'Street lighting infrastructure issue detected. Non-functional or damaged streetlight affects public safety, especially during nighttime hours.',
            severity: 'Medium - Public Safety Concern',
            action: 'Electrical repair or bulb replacement needed'
        }
    },
    {
        keywords: ['water', 'flood', 'rain', 'drain', 'puddle', 'lake', 'swamp', 'gutter', 'sewage', 'sewer'],
        issue: {
            title: 'Drainage / Water Logging Issue',
            description: 'Drainage system malfunction detected. Water logging, blocked drains, or sewage overflow requires immediate attention to prevent flooding and health hazards.',
            severity: 'High - Flooding Risk',
            action: 'Drain cleaning and repair required'
        }
    },
    {
        keywords: ['tree', 'leaf', 'branch', 'wood', 'log', 'trunk', 'foliage', 'plant', 'shrub', 'bush'],
        issue: {
            title: 'Tree / Vegetation Hazard',
            description: 'Tree or vegetation hazard detected. Fallen tree, broken branch, or overgrown vegetation poses a safety risk or blocks public pathways.',
            severity: 'Medium - Safety Hazard',
            action: 'Tree removal or trimming required'
        }
    },
    {
        keywords: ['traffic', 'signal', 'sign', 'signpost', 'billboard', 'barricade', 'barrier', 'cone'],
        issue: {
            title: 'Traffic Infrastructure Issue',
            description: 'Traffic infrastructure issue detected. Damaged, missing, or malfunctioning traffic sign or signal affects road safety and traffic management.',
            severity: 'High - Traffic Safety Concern',
            action: 'Sign/signal repair or replacement needed'
        }
    },
    {
        keywords: ['wall', 'graffiti', 'paint', 'vandal', 'building', 'fence', 'gate', 'broken', 'damaged'],
        issue: {
            title: 'Public Property Vandalism / Damage',
            description: 'Public property damage or vandalism detected. Requires assessment and repair to maintain community standards and public safety.',
            severity: 'Medium - Property Damage',
            action: 'Cleaning, repair, or restoration required'
        }
    }
];

export const aiService = {

    /**
     * Map an array of ImageNet classification labels to a civic issue
     */
    mapLabelsToCivicIssue(labels) {
        for (const mapping of CIVIC_LABEL_MAP) {
            for (const label of labels) {
                const lowerLabel = label.toLowerCase().replace(/_/g, ' ');
                if (mapping.keywords.some(kw => lowerLabel.includes(kw))) {
                    return { ...mapping.issue, isGeneric: false, matchedLabel: label };
                }
            }
        }
        return null; // No match
    },

    async generateCaption(imageFile) {
        try {
            console.log("🚀 Classifying image with Hugging Face ViT...");

            if (!HF_API_KEY) {
                console.warn("⚠️ No Hugging Face API key found.");
                throw new Error("Missing VITE_HUGGINGFACE_API_KEY");
            }

            // Convert to base64 for the serverless function (production)
            // or direct proxy call (local dev)
            const base64Image = await fileToBase64(imageFile);
            const mimeType = imageFile.type || 'image/jpeg';

            let response;
            
            // In local dev, we use the Vite proxy defined in vite.config.js
            // In production, we use the path defined in HF_CLASSIFY_URL which Netlify handles
            const fetchUrl = import.meta.env.DEV 
                ? "/hf-api/models/google/vit-base-patch16-224" 
                : HF_CLASSIFY_URL;

            if (import.meta.env.DEV) {
                // Local: use Vite proxy logic (requires key in frontend for now, or proxy header)
                const arrayBuffer = await imageFile.arrayBuffer();
                response = await fetch(fetchUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${HF_API_KEY}`,
                        'Content-Type': mimeType
                    },
                    body: arrayBuffer
                });
            } else {
                // Production: call Netlify serverless function
                response = await fetch(fetchUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageBase64: base64Image, mimeType })
                });
            }

            if (!response.ok) {
                const errorText = await response.text();
                if (response.status === 503) {
                    throw new Error("Model is loading. Please wait a few seconds and try again.");
                }
                throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            // Returns: [{ label: "pothole", score: 0.9 }, ...]
            console.log("✅ HF Classification result:", data);

            const labels = data.map(d => d.label);
            const civicIssue = this.mapLabelsToCivicIssue(labels);

            if (civicIssue) {
                const topLabel = data[0]?.label?.replace(/_/g, ' ') || 'civic issue';
                let desc = `${civicIssue.description}\n\n`;
                desc += `**AI Detected:** ${topLabel} (confidence: ${(data[0]?.score * 100).toFixed(1)}%)\n`;
                desc += `**Severity:** ${civicIssue.severity}\n`;
                desc += `**Recommended Action:** ${civicIssue.action}`;

                return {
                    title: civicIssue.title,
                    description: desc,
                    isCivicIssue: true,
                    validationReason: `AI identified: ${civicIssue.matchedLabel}`,
                    rawCaption: topLabel
                };
            }

            // No civic match — use top label generically
            const topLabel = data[0]?.label?.replace(/_/g, ' ') || 'infrastructure issue';
            return {
                title: `Reported Issue: ${topLabel.charAt(0).toUpperCase() + topLabel.slice(1)}`,
                description: `AI image analysis detected: **${topLabel}**.\n\nThe reported issue requires assessment and appropriate action from the municipal department.\n\n**Confidence:** ${(data[0]?.score * 100).toFixed(1)}%`,
                isCivicIssue: true,
                validationReason: "AI classified image, no specific civic pattern matched",
                rawCaption: topLabel
            };

        } catch (err) {
            console.error("❌ Hugging Face AI Error:", err.message);
            console.warn("⚠️ Using filename fallback logic...");
            return this.generateFallbackCaption(imageFile);
        }
    },

    generateFallbackCaption(imageFile) {
        const timestamp = new Date().toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
        const fileSize = (imageFile.size / 1024).toFixed(2);
        const fileName = imageFile.name.replace(/\.[^/.]+$/, "").toLowerCase();
        const issueType = this.detectIssueType(fileName);

        if (issueType.isGeneric) {
            return {
                title: "Civic Infrastructure Issue Reported",
                description: `A civic infrastructure issue has been reported. Please review the attached image to identify the specific problem.\n\n**Reported:** ${timestamp}\n**Image file:** ${imageFile.name} (${fileSize} KB)\n\n**Note:** AI analysis was unavailable. Manual review required.`,
                isCivicIssue: true,
                validationReason: "AI analysis unavailable. Assuming valid civic issue pending manual review."
            };
        }

        let description = `${issueType.description}\n\n`;
        description += `**Reported:** ${timestamp}\n`;
        description += `**Severity:** ${issueType.severity}\n`;
        description += `**Recommended Action:** ${issueType.action}\n\n`;
        description += `Image file: ${imageFile.name} (${fileSize} KB)`;

        return {
            title: issueType.title,
            rawCaption: issueType.rawDescription,
            description: description,
            isCivicIssue: true,
            validationReason: "Issue identified from file details"
        };
    },

    detectIssueType(fileName) {
        if (fileName.includes('pothole') || fileName.includes('hole') || fileName.includes('crack')) {
            return {
                title: 'Road Damage - Pothole/Crack Detected',
                rawDescription: 'Damaged road surface with visible pothole or crack',
                description: 'Road surface damage detected. The image shows a pothole or crack in the road that poses a safety hazard to vehicles and pedestrians.',
                severity: 'High - Safety hazard',
                action: 'Road repair and resurfacing required'
            };
        }
        if (fileName.includes('garbage') || fileName.includes('trash') || fileName.includes('waste') || fileName.includes('dump')) {
            return {
                title: 'Waste Management Issue - Garbage Accumulation',
                rawDescription: 'Garbage or waste accumulation in public area',
                description: 'Improper waste disposal or garbage accumulation detected. This creates health hazards and environmental concerns.',
                severity: 'Medium - Health and sanitation concern',
                action: 'Waste collection and area cleaning required'
            };
        }
        if (fileName.includes('street') && (fileName.includes('light') || fileName.includes('lamp'))) {
            return {
                title: 'Street Lighting Issue',
                rawDescription: 'Streetlight malfunction or damage',
                description: 'Street lighting infrastructure issue detected. A non-functional or damaged streetlight affects public safety.',
                severity: 'Medium - Public safety concern',
                action: 'Electrical repair or bulb replacement needed'
            };
        }
        if (fileName.includes('drain') || fileName.includes('sewer') || fileName.includes('water') || fileName.includes('flood')) {
            return {
                title: 'Drainage System Problem',
                rawDescription: 'Drainage or water logging issue',
                description: 'Drainage system malfunction detected. Water logging or blocked drains require immediate attention.',
                severity: 'High - Flooding risk',
                action: 'Drainage cleaning and repair required'
            };
        }
        if (fileName.includes('road') || fileName.includes('street') || fileName.includes('pavement')) {
            return {
                title: 'Road Infrastructure Issue',
                rawDescription: 'Road or pavement infrastructure problem',
                description: 'Road infrastructure problem detected. Damage or deterioration affects traffic flow and pedestrian safety.',
                severity: 'Medium - Infrastructure maintenance needed',
                action: 'Road maintenance and repair required'
            };
        }
        if (fileName.includes('tree') || fileName.includes('branch')) {
            return {
                title: 'Tree/Vegetation Hazard',
                rawDescription: 'Fallen tree or hazardous branch',
                description: 'Tree or vegetation hazard detected. A fallen tree or broken branch poses a safety risk.',
                severity: 'Medium - Safety hazard',
                action: 'Tree removal or trimming required'
            };
        }
        if (fileName.includes('sign') || fileName.includes('signal') || fileName.includes('traffic')) {
            return {
                title: 'Traffic Infrastructure Issue',
                rawDescription: 'Traffic sign or signal malfunction',
                description: 'Traffic infrastructure problem detected. Damaged or missing signs/signals affect road safety.',
                severity: 'High - Traffic safety concern',
                action: 'Sign/signal repair or replacement needed'
            };
        }
        return {
            isGeneric: true,
            title: 'Civic Infrastructure Issue',
            rawDescription: 'General civic infrastructure problem',
            description: 'A civic infrastructure issue has been reported. Requires assessment and appropriate action from the municipal department.',
            severity: 'To be assessed',
            action: 'Assessment and appropriate action required'
        };
    }
};
