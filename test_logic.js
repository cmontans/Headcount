// Copied logic from src/utils/xlsx.js to avoid dependencies
function inferOrgHierarchy(allOrgs, targetOrgs) {
    const parentMap = new Map();

    // Helper to extract code (first word)
    const getCode = (t) => t.trim().split(/\s+/)[0].toLowerCase();

    const allTitles = allOrgs.map((o) => ({
        original: o.title,
        lower: o.title.toLowerCase().trim(),
        code: getCode(o.title)
    }));

    for (const org of targetOrgs) {
        const titleLower = org.title.toLowerCase().trim();
        const orgCode = getCode(org.title);

        let bestMatch = null;
        let bestMatchLen = 0;

        for (const candidate of allTitles) {
            // 1. Full Title Prefix Match (Existing)
            // Must be strict prefix
            if (candidate.lower.length < titleLower.length && titleLower.startsWith(candidate.lower)) {
                if (candidate.lower.length > bestMatchLen) {
                    bestMatch = candidate.original;
                    bestMatchLen = candidate.lower.length;
                }
            }

            // 2. Code Prefix Match (New)
            // Code must be strict prefix of orgCode
            if (candidate.code.length < orgCode.length && orgCode.startsWith(candidate.code)) {
                if (candidate.code.length > bestMatchLen) {
                    bestMatch = candidate.original;
                    bestMatchLen = candidate.code.length;
                }
            }
        }

        if (bestMatch) {
            parentMap.set(org.title, bestMatch);
        }
    }

    return parentMap;
}

// Mock data based on user screenshot
const allOrgs = [
    { title: "TASTO Conversion Training & Operational Sup" },
    { title: "TASTO1 Combat Aircraft Training" },
    { title: "TASTO11 Training Solutions" },
    { title: "TASTO2 Transport & Mission Training" },
    { title: "TASTO3 Flight Operations Services" },
    { title: "TASTO31 EFB, Tools and Standardization" },
    { title: "TASTO4 A400M Training" },
    { title: "TASTO41 A400M Mtnce Training-Courses D" },
    { title: "TASTO42 A400M Flight Crew Training" },
    { title: "TASTO5 Training Centres Services" }
];

const map = inferOrgHierarchy(allOrgs, allOrgs);

console.log("Hierarchy Map:");
map.forEach((parent, child) => {
    console.log(`"${child}" -> "${parent}"`);
});

// Check expectations
const checks = [
    { child: "TASTO1 Combat Aircraft Training", parent: "TASTO Conversion Training & Operational Sup" },
    { child: "TASTO11 Training Solutions", parent: "TASTO1 Combat Aircraft Training" }
];

let allPassed = true;
checks.forEach(check => {
    const actual = map.get(check.child);
    if (actual === check.parent) {
        console.log(`[PASS] ${check.child} has correct parent.`);
    } else {
        console.log(`[FAIL] ${check.child} has parent "${actual}" (expected "${check.parent}")`);
        allPassed = false;
    }
});
