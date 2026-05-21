import type { ChallengeMode, WorldNode } from '$lib/world/adventureWorld';

export const CHALLENGE_MODES = {
    DICTEE: 'dictee',
    CALCUL: 'calcul',
    LOGIC: 'logic',
    QCM: 'qcm'
} as const satisfies Record<string, ChallengeMode>;

export type ChallengeResult = {
    success: boolean;
    points: number;
    detail: string;
};

export type ChoiceChallenge = {
    prompt: string;
    options: [string, string, string];
    answer: 0 | 1 | 2;
    explanation: string;
};

export const adventureNodes: WorldNode[] = [
    {
        id: 'village-carrefour',
        mode: CHALLENGE_MODES.DICTEE,
        level: 0,
        title: 'Village Carrefour',
        theme: 'Les voitures font vroum, mais ton clavier garde le cap.',
        reward: 'Boussole verte',
        icon: 'V',
        x: 4,
        y: 4
    },
    {
        id: 'garage-propre',
        mode: CHALLENGE_MODES.CALCUL,
        title: 'Garage Propre',
        theme: 'Compte les roues, economise le carburant, evite la fumee.',
        reward: 'Cle a molette solaire',
        icon: 'C',
        x: 6,
        y: 4
    },
    {
        id: 'foret-des-animaux',
        mode: CHALLENGE_MODES.LOGIC,
        title: 'Foret des Animaux',
        theme: 'Aide les animaux avec logique et gentillesse.',
        reward: 'Graine brillante',
        icon: 'L',
        x: 8,
        y: 5
    },
    {
        id: 'bibliotheque-fg',
        mode: CHALLENGE_MODES.QCM,
        title: 'Bibliotheque Franco-Allemande',
        theme: 'Culture generale, France, Allemagne et petites curiosites.',
        reward: 'Carte du savoir',
        icon: 'Q',
        x: 3,
        y: 6
    },
    {
        id: 'marais-climat',
        mode: CHALLENGE_MODES.DICTEE,
        level: 1,
        title: 'Marais du Climat',
        theme: 'Des mots justes pour proteger la planete.',
        reward: 'Cape anti-smog',
        icon: 'D',
        x: 7,
        y: 7
    },
    {
        id: 'pont-des-nombres',
        mode: CHALLENGE_MODES.CALCUL,
        title: 'Pont des Nombres',
        theme: 'Un pont tient mieux quand les retenues sont solides.',
        reward: 'Pont-levis de poche',
        icon: 'C',
        x: 9,
        y: 6
    },
    {
        id: 'observatoire-meteo',
        mode: CHALLENGE_MODES.LOGIC,
        title: 'Observatoire Meteo',
        theme: 'Lis les indices du ciel sans reveiller la tempete.',
        reward: 'Barometre malin',
        icon: 'L',
        x: 2,
        y: 3
    },
    {
        id: 'chateau-des-tresors',
        mode: CHALLENGE_MODES.QCM,
        title: 'Chateau des Tresors',
        theme: 'Le grand quiz avant le coffre final.',
        reward: 'Couronne des curieux',
        icon: 'Q',
        x: 10,
        y: 5
    }
];

export const logicChallenges: ChoiceChallenge[] = [
    {
        prompt: 'Une voiture sale fume beaucoup. Quel choix aide le plus le village ?',
        options: ['Laver la voiture dans la riviere', 'Prendre le velo pour un petit trajet', 'Laisser tourner le moteur'],
        answer: 1,
        explanation: 'Pour un petit trajet, le velo evite la fumee et garde l air plus propre.'
    },
    {
        prompt: 'Suite logique : 2, 4, 8, 16, ...',
        options: ['18', '24', '32'],
        answer: 2,
        explanation: 'Chaque nombre double le precedent.'
    },
    {
        prompt: 'Un renard, une poule et un sac de graines attendent. Que proteges-tu de la poule ?',
        options: ['Le renard', 'Les graines', 'Le vent'],
        answer: 1,
        explanation: 'La poule peut manger les graines, il faut donc les proteger.'
    },
    {
        prompt: 'Quel objet ne va pas avec les autres ?',
        options: ['Train', 'Bus', 'Carotte'],
        answer: 2,
        explanation: 'Le train et le bus transportent des personnes; la carotte se mange.'
    }
];

export const qcmChallenges: ChoiceChallenge[] = [
    {
        prompt: 'Quelle ville est la capitale de l Allemagne ?',
        options: ['Berlin', 'Munich', 'Hambourg'],
        answer: 0,
        explanation: 'Berlin est la capitale allemande.'
    },
    {
        prompt: 'En Allemagne, comment dit-on bonjour le matin ?',
        options: ['Guten Morgen', 'Bonne nuit', 'Danke schon'],
        answer: 0,
        explanation: 'Guten Morgen veut dire bonjour le matin.'
    },
    {
        prompt: 'Quel fleuve traverse Paris ?',
        options: ['Le Rhin', 'La Seine', 'Le Danube'],
        answer: 1,
        explanation: 'La Seine traverse Paris.'
    },
    {
        prompt: 'Quel geste aide le climat a la maison ?',
        options: ['Eteindre la lumiere inutile', 'Ouvrir le frigo longtemps', 'Jeter les piles dehors'],
        answer: 0,
        explanation: 'Eteindre la lumiere inutile economise de l energie.'
    }
];
