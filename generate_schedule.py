import pandas as pd
import networkx as nx
import collections
import re

# Load Excel data
df = pd.read_excel(r'C:\Users\Shuvo\Downloads\FIFA_World_Cup_2026_Full_72_Matches_BST.xlsx')

flag_map = {
    'Algeria': 'dz', 'Argentina': 'ar', 'Australia': 'au', 'Austria': 'at',
    'Belgium': 'be', 'Bosnia & Herzegovina': 'ba', 'Brazil': 'br',
    'Cabo Verde': 'cv', 'Canada': 'ca', 'Colombia': 'co', 'Congo': 'cg',
    'Croatia': 'hr', 'Curaçao': 'cw', 'Czechia': 'cz', 'Ecuador': 'ec',
    'Egypt': 'eg', 'England': 'gb-eng', 'France': 'fr', 'Germany': 'de',
    'Ghana': 'gh', 'Haiti': 'ht', 'Iran': 'ir', 'Iraq': 'iq',
    'Ivory Coast': 'ci', 'Japan': 'jp', 'Jordan': 'jo', 'Korea Republic': 'kr',
    'Mexico': 'mx', 'Morocco': 'ma', 'Netherlands': 'nl', 'New Zealand': 'nz',
    'Norway': 'no', 'Panama': 'pa', 'Paraguay': 'py', 'Portugal': 'pt',
    'Qatar': 'qa', 'Saudi Arabia': 'sa', 'Scotland': 'gb-sct', 'Senegal': 'sn',
    'South Africa': 'za', 'Spain': 'es', 'Sweden': 'se', 'Switzerland': 'ch',
    'Tunisia': 'tn', 'Türkiye': 'tr', 'USA': 'us', 'Uruguay': 'uy', 'Uzbekistan': 'uz'
}

def clean_team_name(t):
    t = t.strip()
    if 'Cura' in t and 'ao' in t: return 'Curaçao'
    if 'rkiye' in t: return 'Türkiye'
    return t

G = nx.Graph()
match_group_votes = collections.defaultdict(list)

for idx, row in df.iterrows():
    match = str(row['Match'])
    teams = [clean_team_name(t) for t in match.split(' vs ')]
    if len(teams) == 2:
        G.add_edge(teams[0], teams[1])
        match_group_votes[frozenset(teams)].append(str(row['Group']).strip())

components = list(nx.connected_components(G))
group_assignments = {}

# Assign correct group letter by majority vote from the excel sheet for that component
for comp in components:
    votes = []
    for u in comp:
        for v in comp:
            if u != v:
                fs = frozenset([u, v])
                if fs in match_group_votes:
                    votes.extend(match_group_votes[fs])
    
    if votes:
        counter = collections.Counter(votes)
        best_group = counter.most_common(1)[0][0]
    else:
        best_group = 'Unknown'
    
    for t in comp:
        group_assignments[t] = best_group

# Sort groups A-L
sorted_groups = sorted(list(set(group_assignments.values())))

groups_js = "export const GROUPS_2026 = [\n"
for g in sorted_groups:
    g_teams = [t for t, grp in group_assignments.items() if grp == g]
    groups_js += f'  {{\n    name: "Group {g}",\n    teams: [\n'
    for team in sorted(g_teams):
        flag_code = flag_map.get(team, 'default')
        groups_js += f'      {{ name: "{team}", flag: "/flags/{flag_code}.png" }},\n'
    groups_js += "    ],\n  },\n"
groups_js += "];\n\n"

# Generate fixtures
fixtures_js = "export const FIXTURES_2026 = [\n"
for g in sorted_groups:
    fixtures_js += f'  // ── Group {g} ──\n'
    g_teams = set([t for t, grp in group_assignments.items() if grp == g])
    
    # find matches where both teams are in this group
    for idx, row in df.iterrows():
        match = str(row['Match'])
        teams = [clean_team_name(t) for t in match.split(' vs ')]
        if len(teams) == 2 and teams[0] in g_teams and teams[1] in g_teams:
            date = str(row['Date']).strip()
            date = date.replace('June', 'Jun').replace('July', 'Jul')
            match_str = f"{teams[0]} vs {teams[1]}"
            time_str = str(row['Time (BST)']).strip()
            if time_str == 'nan':
                time_str = "TBD"
            
            fixtures_js += f'  {{ date: "{date}", match: "{match_str}", group: "Group {g}", time: "{time_str}", stage: "Group Stage" }},\n'
    fixtures_js += "\n"

# Read existing schedule2026.js to extract knockout stages
with open('app/data/schedule2026.js', 'r', encoding='utf-8') as f:
    existing_content = f.read()

# Find the knockout portion
knockout_index = existing_content.find('  // ── Round of 32')
if knockout_index != -1:
    knockout_part = existing_content[knockout_index:]
else:
    knockout_part = "];\n" # fallback

# Rebuild the file
final_content = "// FIFA World Cup 2026 — Parsed from official schedule\n\n"
final_content += groups_js
final_content += fixtures_js
final_content += knockout_part

with open('app/data/schedule2026.js', 'w', encoding='utf-8') as f:
    f.write(final_content)

print("Schedule successfully regenerated.")
