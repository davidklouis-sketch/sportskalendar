// Football Leagues and Teams
export const FOOTBALL_LEAGUES = [
  { id: 39, name: 'Premier League', country: 'England' },
  { id: 78, name: 'Bundesliga', country: 'Germany' },
  { id: 2, name: 'Champions League', country: 'Europe' },
  { id: 4, name: 'EM/WM', country: 'International' },
];

export const FOOTBALL_TEAMS: Record<number, Array<{ id: string; name: string }>> = {
  39: [ // Premier League
    { id: '33', name: 'Manchester United' },
    { id: '34', name: 'Newcastle United' },
    { id: '35', name: 'Bournemouth' },
    { id: '36', name: 'Fulham' },
    { id: '39', name: 'Wolves' },
    { id: '40', name: 'Liverpool' },
    { id: '41', name: 'Southampton' },
    { id: '42', name: 'Arsenal' },
    { id: '45', name: 'Everton' },
    { id: '46', name: 'Leicester City' },
    { id: '47', name: 'Tottenham' },
    { id: '48', name: 'West Ham' },
    { id: '49', name: 'Chelsea' },
    { id: '50', name: 'Manchester City' },
    { id: '51', name: 'Brighton' },
    { id: '52', name: 'Crystal Palace' },
    { id: '55', name: 'Brentford' },
    { id: '65', name: 'Nottingham Forest' },
    { id: '66', name: 'Aston Villa' },
  ],
  78: [ // Bundesliga
    { id: '157', name: 'Bayern Munich' },
    { id: '165', name: 'Borussia Dortmund' },
    { id: '168', name: 'Bayer Leverkusen' },
    { id: '173', name: 'RB Leipzig' },
    { id: '159', name: 'Hertha Berlin' },
    { id: '160', name: 'SC Freiburg' },
    { id: '161', name: 'VfL Wolfsburg' },
    { id: '162', name: 'Werder Bremen' },
    { id: '163', name: 'Borussia Mönchengladbach' },
    { id: '164', name: 'Mainz 05' },
    { id: '166', name: 'Eintracht Frankfurt' },
    { id: '167', name: '1899 Hoffenheim' },
    { id: '169', name: 'VfB Stuttgart' },
    { id: '170', name: 'FC Augsburg' },
    { id: '172', name: 'VfL Bochum' },
    { id: '182', name: 'Union Berlin' },
    { id: '192', name: 'FC Köln' },
    { id: '721', name: 'Holstein Kiel' },
  ],
  2: [ // Champions League
    { id: '529', name: 'Barcelona' },
    { id: '530', name: 'Atletico Madrid' },
    { id: '531', name: 'Athletic Club' },
    { id: '532', name: 'Valencia' },
    { id: '533', name: 'Villarreal' },
    { id: '536', name: 'Sevilla' },
    { id: '541', name: 'Real Madrid' },
    { id: '489', name: 'AC Milan' },
    { id: '492', name: 'Napoli' },
    { id: '496', name: 'Juventus' },
    { id: '497', name: 'AS Roma' },
    { id: '499', name: 'Atalanta' },
    { id: '500', name: 'Bologna' },
    { id: '502', name: 'Fiorentina' },
    { id: '505', name: 'Inter' },
    { id: '85', name: 'Paris Saint Germain' },
    { id: '81', name: 'Marseille' },
    { id: '83', name: 'Nantes' },
    { id: '91', name: 'Monaco' },
    { id: '42', name: 'Arsenal' },
    { id: '47', name: 'Tottenham' },
    { id: '50', name: 'Manchester City' },
    { id: '40', name: 'Liverpool' },
    { id: '157', name: 'Bayern Munich' },
    { id: '165', name: 'Borussia Dortmund' },
    { id: '168', name: 'Bayer Leverkusen' },
    { id: '173', name: 'RB Leipzig' },
  ],
  4: [ // International
    { id: '768', name: 'Germany' },
    { id: '770', name: 'France' },
    { id: '773', name: 'England' },
    { id: '768', name: 'Spain' },
    { id: '784', name: 'Italy' },
    { id: '1118', name: 'Netherlands' },
    { id: '1099', name: 'Portugal' },
    { id: '1108', name: 'Belgium' },
    { id: '769', name: 'Croatia' },
    { id: '1089', name: 'Switzerland' },
    { id: '1105', name: 'Denmark' },
    { id: '767', name: 'Austria' },
    { id: '15', name: 'Poland' },
    { id: '25', name: 'Ukraine' },
    { id: '26', name: 'Czech Republic' },
    { id: '1107', name: 'Sweden' },
  ],
};

// F1 Drivers
export const F1_DRIVERS = [
  { id: 'verstappen', name: 'Max Verstappen', team: 'Red Bull Racing' },
  { id: 'perez', name: 'Sergio Pérez', team: 'Red Bull Racing' },
  { id: 'leclerc', name: 'Charles Leclerc', team: 'Ferrari' },
  { id: 'sainz', name: 'Carlos Sainz', team: 'Ferrari' },
  { id: 'hamilton', name: 'Lewis Hamilton', team: 'Mercedes' },
  { id: 'russell', name: 'George Russell', team: 'Mercedes' },
  { id: 'norris', name: 'Lando Norris', team: 'McLaren' },
  { id: 'piastri', name: 'Oscar Piastri', team: 'McLaren' },
  { id: 'alonso', name: 'Fernando Alonso', team: 'Aston Martin' },
  { id: 'stroll', name: 'Lance Stroll', team: 'Aston Martin' },
  { id: 'gasly', name: 'Pierre Gasly', team: 'Alpine' },
  { id: 'ocon', name: 'Esteban Ocon', team: 'Alpine' },
  { id: 'hulkenberg', name: 'Nico Hülkenberg', team: 'Haas' },
  { id: 'magnussen', name: 'Kevin Magnussen', team: 'Haas' },
  { id: 'bottas', name: 'Valtteri Bottas', team: 'Alfa Romeo' },
  { id: 'zhou', name: 'Zhou Guanyu', team: 'Alfa Romeo' },
  { id: 'tsunoda', name: 'Yuki Tsunoda', team: 'AlphaTauri' },
  { id: 'ricciardo', name: 'Daniel Ricciardo', team: 'AlphaTauri' },
  { id: 'albon', name: 'Alexander Albon', team: 'Williams' },
  { id: 'sargeant', name: 'Logan Sargeant', team: 'Williams' },
];

// NFL Teams
export const NFL_TEAMS = [
  // AFC East
  { id: 'buf', name: 'Buffalo Bills', division: 'AFC East' },
  { id: 'mia', name: 'Miami Dolphins', division: 'AFC East' },
  { id: 'ne', name: 'New England Patriots', division: 'AFC East' },
  { id: 'nyj', name: 'New York Jets', division: 'AFC East' },
  // AFC North
  { id: 'bal', name: 'Baltimore Ravens', division: 'AFC North' },
  { id: 'cin', name: 'Cincinnati Bengals', division: 'AFC North' },
  { id: 'cle', name: 'Cleveland Browns', division: 'AFC North' },
  { id: 'pit', name: 'Pittsburgh Steelers', division: 'AFC North' },
  // AFC South
  { id: 'hou', name: 'Houston Texans', division: 'AFC South' },
  { id: 'ind', name: 'Indianapolis Colts', division: 'AFC South' },
  { id: 'jax', name: 'Jacksonville Jaguars', division: 'AFC South' },
  { id: 'ten', name: 'Tennessee Titans', division: 'AFC South' },
  // AFC West
  { id: 'den', name: 'Denver Broncos', division: 'AFC West' },
  { id: 'kc', name: 'Kansas City Chiefs', division: 'AFC West' },
  { id: 'lv', name: 'Las Vegas Raiders', division: 'AFC West' },
  { id: 'lac', name: 'Los Angeles Chargers', division: 'AFC West' },
  // NFC East
  { id: 'dal', name: 'Dallas Cowboys', division: 'NFC East' },
  { id: 'nyg', name: 'New York Giants', division: 'NFC East' },
  { id: 'phi', name: 'Philadelphia Eagles', division: 'NFC East' },
  { id: 'was', name: 'Washington Commanders', division: 'NFC East' },
  // NFC North
  { id: 'chi', name: 'Chicago Bears', division: 'NFC North' },
  { id: 'det', name: 'Detroit Lions', division: 'NFC North' },
  { id: 'gb', name: 'Green Bay Packers', division: 'NFC North' },
  { id: 'min', name: 'Minnesota Vikings', division: 'NFC North' },
  // NFC South
  { id: 'atl', name: 'Atlanta Falcons', division: 'NFC South' },
  { id: 'car', name: 'Carolina Panthers', division: 'NFC South' },
  { id: 'no', name: 'New Orleans Saints', division: 'NFC South' },
  { id: 'tb', name: 'Tampa Bay Buccaneers', division: 'NFC South' },
  // NFC West
  { id: 'ari', name: 'Arizona Cardinals', division: 'NFC West' },
  { id: 'lar', name: 'Los Angeles Rams', division: 'NFC West' },
  { id: 'sf', name: 'San Francisco 49ers', division: 'NFC West' },
  { id: 'sea', name: 'Seattle Seahawks', division: 'NFC West' },
];

// NBA Teams
export const NBA_TEAMS = [
  // Eastern Conference - Atlantic Division
  { id: '134878', name: 'Boston Celtics', conference: 'Eastern', division: 'Atlantic' },
  { id: '134879', name: 'Brooklyn Nets', conference: 'Eastern', division: 'Atlantic' },
  { id: '134880', name: 'New York Knicks', conference: 'Eastern', division: 'Atlantic' },
  { id: '134881', name: 'Philadelphia 76ers', conference: 'Eastern', division: 'Atlantic' },
  { id: '134882', name: 'Toronto Raptors', conference: 'Eastern', division: 'Atlantic' },
  
  // Eastern Conference - Central Division
  { id: '134883', name: 'Chicago Bulls', conference: 'Eastern', division: 'Central' },
  { id: '134884', name: 'Cleveland Cavaliers', conference: 'Eastern', division: 'Central' },
  { id: '134885', name: 'Detroit Pistons', conference: 'Eastern', division: 'Central' },
  { id: '134886', name: 'Indiana Pacers', conference: 'Eastern', division: 'Central' },
  { id: '134887', name: 'Milwaukee Bucks', conference: 'Eastern', division: 'Central' },
  
  // Eastern Conference - Southeast Division
  { id: '134888', name: 'Atlanta Hawks', conference: 'Eastern', division: 'Southeast' },
  { id: '134889', name: 'Charlotte Hornets', conference: 'Eastern', division: 'Southeast' },
  { id: '134890', name: 'Miami Heat', conference: 'Eastern', division: 'Southeast' },
  { id: '134891', name: 'Orlando Magic', conference: 'Eastern', division: 'Southeast' },
  { id: '134892', name: 'Washington Wizards', conference: 'Eastern', division: 'Southeast' },
  
  // Western Conference - Northwest Division
  { id: '134893', name: 'Denver Nuggets', conference: 'Western', division: 'Northwest' },
  { id: '134894', name: 'Minnesota Timberwolves', conference: 'Western', division: 'Northwest' },
  { id: '134895', name: 'Oklahoma City Thunder', conference: 'Western', division: 'Northwest' },
  { id: '134896', name: 'Portland Trail Blazers', conference: 'Western', division: 'Northwest' },
  { id: '134897', name: 'Utah Jazz', conference: 'Western', division: 'Northwest' },
  
  // Western Conference - Pacific Division
  { id: '134898', name: 'Golden State Warriors', conference: 'Western', division: 'Pacific' },
  { id: '134899', name: 'LA Clippers', conference: 'Western', division: 'Pacific' },
  { id: '134900', name: 'Los Angeles Lakers', conference: 'Western', division: 'Pacific' },
  { id: '134901', name: 'Phoenix Suns', conference: 'Western', division: 'Pacific' },
  { id: '134902', name: 'Sacramento Kings', conference: 'Western', division: 'Pacific' },
  
  // Western Conference - Southwest Division
  { id: '134903', name: 'Dallas Mavericks', conference: 'Western', division: 'Southwest' },
  { id: '134904', name: 'Houston Rockets', conference: 'Western', division: 'Southwest' },
  { id: '134905', name: 'Memphis Grizzlies', conference: 'Western', division: 'Southwest' },
  { id: '134906', name: 'New Orleans Pelicans', conference: 'Western', division: 'Southwest' },
  { id: '134907', name: 'San Antonio Spurs', conference: 'Western', division: 'Southwest' },
];

// NHL Teams
export const NHL_TEAMS = [
  // Eastern Conference - Atlantic Division
  { id: '134938', name: 'Boston Bruins', conference: 'Eastern', division: 'Atlantic' },
  { id: '134939', name: 'Buffalo Sabres', conference: 'Eastern', division: 'Atlantic' },
  { id: '134940', name: 'Detroit Red Wings', conference: 'Eastern', division: 'Atlantic' },
  { id: '134941', name: 'Florida Panthers', conference: 'Eastern', division: 'Atlantic' },
  { id: '134942', name: 'Montreal Canadiens', conference: 'Eastern', division: 'Atlantic' },
  { id: '134943', name: 'Ottawa Senators', conference: 'Eastern', division: 'Atlantic' },
  { id: '134944', name: 'Tampa Bay Lightning', conference: 'Eastern', division: 'Atlantic' },
  { id: '134945', name: 'Toronto Maple Leafs', conference: 'Eastern', division: 'Atlantic' },
  
  // Eastern Conference - Metropolitan Division
  { id: '134946', name: 'Carolina Hurricanes', conference: 'Eastern', division: 'Metropolitan' },
  { id: '134947', name: 'Columbus Blue Jackets', conference: 'Eastern', division: 'Metropolitan' },
  { id: '134948', name: 'New Jersey Devils', conference: 'Eastern', division: 'Metropolitan' },
  { id: '134949', name: 'New York Islanders', conference: 'Eastern', division: 'Metropolitan' },
  { id: '134950', name: 'New York Rangers', conference: 'Eastern', division: 'Metropolitan' },
  { id: '134951', name: 'Philadelphia Flyers', conference: 'Eastern', division: 'Metropolitan' },
  { id: '134952', name: 'Pittsburgh Penguins', conference: 'Eastern', division: 'Metropolitan' },
  { id: '134953', name: 'Washington Capitals', conference: 'Eastern', division: 'Metropolitan' },
  
  // Western Conference - Central Division
  { id: '134954', name: 'Arizona Coyotes', conference: 'Western', division: 'Central' },
  { id: '134955', name: 'Chicago Blackhawks', conference: 'Western', division: 'Central' },
  { id: '134956', name: 'Colorado Avalanche', conference: 'Western', division: 'Central' },
  { id: '134957', name: 'Dallas Stars', conference: 'Western', division: 'Central' },
  { id: '134958', name: 'Minnesota Wild', conference: 'Western', division: 'Central' },
  { id: '134959', name: 'Nashville Predators', conference: 'Western', division: 'Central' },
  { id: '134960', name: 'St. Louis Blues', conference: 'Western', division: 'Central' },
  { id: '134961', name: 'Winnipeg Jets', conference: 'Western', division: 'Central' },
  
  // Western Conference - Pacific Division
  { id: '134962', name: 'Anaheim Ducks', conference: 'Western', division: 'Pacific' },
  { id: '134963', name: 'Calgary Flames', conference: 'Western', division: 'Pacific' },
  { id: '134964', name: 'Edmonton Oilers', conference: 'Western', division: 'Pacific' },
  { id: '134965', name: 'Los Angeles Kings', conference: 'Western', division: 'Pacific' },
  { id: '134966', name: 'San Jose Sharks', conference: 'Western', division: 'Pacific' },
  { id: '134967', name: 'Seattle Kraken', conference: 'Western', division: 'Pacific' },
  { id: '134968', name: 'Vancouver Canucks', conference: 'Western', division: 'Pacific' },
  { id: '134969', name: 'Vegas Golden Knights', conference: 'Western', division: 'Pacific' },
];

// MLB Teams
export const MLB_TEAMS = [
  // American League - East
  { id: '135255', name: 'Baltimore Orioles', league: 'American', division: 'East' },
  { id: '135256', name: 'Boston Red Sox', league: 'American', division: 'East' },
  { id: '135257', name: 'New York Yankees', league: 'American', division: 'East' },
  { id: '135258', name: 'Tampa Bay Rays', league: 'American', division: 'East' },
  { id: '135259', name: 'Toronto Blue Jays', league: 'American', division: 'East' },
  
  // American League - Central
  { id: '135260', name: 'Chicago White Sox', league: 'American', division: 'Central' },
  { id: '135261', name: 'Cleveland Guardians', league: 'American', division: 'Central' },
  { id: '135262', name: 'Detroit Tigers', league: 'American', division: 'Central' },
  { id: '135263', name: 'Kansas City Royals', league: 'American', division: 'Central' },
  { id: '135264', name: 'Minnesota Twins', league: 'American', division: 'Central' },
  
  // American League - West
  { id: '135265', name: 'Houston Astros', league: 'American', division: 'West' },
  { id: '135266', name: 'Los Angeles Angels', league: 'American', division: 'West' },
  { id: '135267', name: 'Oakland Athletics', league: 'American', division: 'West' },
  { id: '135268', name: 'Seattle Mariners', league: 'American', division: 'West' },
  { id: '135269', name: 'Texas Rangers', league: 'American', division: 'West' },
  
  // National League - East
  { id: '135270', name: 'Atlanta Braves', league: 'National', division: 'East' },
  { id: '135271', name: 'Miami Marlins', league: 'National', division: 'East' },
  { id: '135272', name: 'New York Mets', league: 'National', division: 'East' },
  { id: '135273', name: 'Philadelphia Phillies', league: 'National', division: 'East' },
  { id: '135274', name: 'Washington Nationals', league: 'National', division: 'East' },
  
  // National League - Central
  { id: '135275', name: 'Chicago Cubs', league: 'National', division: 'Central' },
  { id: '135276', name: 'Cincinnati Reds', league: 'National', division: 'Central' },
  { id: '135277', name: 'Milwaukee Brewers', league: 'National', division: 'Central' },
  { id: '135278', name: 'Pittsburgh Pirates', league: 'National', division: 'Central' },
  { id: '135279', name: 'St. Louis Cardinals', league: 'National', division: 'Central' },
  
  // National League - West
  { id: '135280', name: 'Arizona Diamondbacks', league: 'National', division: 'West' },
  { id: '135281', name: 'Colorado Rockies', league: 'National', division: 'West' },
  { id: '135282', name: 'Los Angeles Dodgers', league: 'National', division: 'West' },
  { id: '135283', name: 'San Diego Padres', league: 'National', division: 'West' },
  { id: '135284', name: 'San Francisco Giants', league: 'National', division: 'West' },
];

