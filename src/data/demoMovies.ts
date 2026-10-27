export interface DemoMovie {
  id: string;
  title: string;
  posterUrl: string;
  backdropUrl?: string;
  year: string;
  genres: string[];
  description: string;
  rating: string;
  runtime?: string;
  director?: string;
  cast?: string;
  status: 'now_showing' | 'upcoming';
  releaseDate?: string;
}

export const DEMO_MOVIES: DemoMovie[] = [
  {
    id: 'tt0816692',
    title: 'Interstellar',
    year: '2014',
    runtime: '169 min',
    genres: ['Adventure', 'Drama', 'Sci-Fi'],
    rating: '8.7',
    director: 'Christopher Nolan',
    cast: 'Matthew McConaughey, Anne Hathaway, Jessica Chastain',
    description: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1920&q=80',
    status: 'now_showing',
    releaseDate: '07 Nov 2014'
  },
  {
    id: 'tt15239678',
    title: 'Dune: Part Two',
    year: '2024',
    runtime: '166 min',
    genres: ['Action', 'Adventure', 'Sci-Fi'],
    rating: '8.6',
    director: 'Denis Villeneuve',
    cast: 'Timothée Chalamet, Zendaya, Rebecca Ferguson',
    description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80',
    status: 'now_showing',
    releaseDate: '01 Mar 2024'
  },
  {
    id: 'tt15398776',
    title: 'Oppenheimer',
    year: '2023',
    runtime: '180 min',
    genres: ['Biography', 'Drama', 'History'],
    rating: '8.9',
    director: 'Christopher Nolan',
    cast: 'Cillian Murphy, Emily Blunt, Matt Damon',
    description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
    posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80',
    status: 'now_showing',
    releaseDate: '21 Jul 2023'
  },
  {
    id: 'tt0468569',
    title: 'The Dark Knight',
    year: '2008',
    runtime: '152 min',
    genres: ['Action', 'Crime', 'Drama'],
    rating: '9.0',
    director: 'Christopher Nolan',
    cast: 'Christian Bale, Heath Ledger, Aaron Eckhart',
    description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological tests of his ability to fight injustice.',
    posterUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1920&q=80',
    status: 'now_showing',
    releaseDate: '18 Jul 2008'
  },
  {
    id: 'tt1375666',
    title: 'Inception',
    year: '2010',
    runtime: '148 min',
    genres: ['Action', 'Adventure', 'Sci-Fi'],
    rating: '8.8',
    director: 'Christopher Nolan',
    cast: 'Leonardo DiCaprio, Joseph Gordon-Levitt, Elliot Page',
    description: 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80',
    status: 'now_showing',
    releaseDate: '16 Jul 2010'
  },
  {
    id: 'tt9362722',
    title: 'Spider-Man: Across the Spider-Verse',
    year: '2023',
    runtime: '140 min',
    genres: ['Animation', 'Action', 'Adventure'],
    rating: '8.7',
    director: 'Joaquim Dos Santos, Kemp Powers',
    cast: 'Shameik Moore, Hailee Steinfeld, Oscar Isaac',
    description: 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.',
    posterUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1920&q=80',
    status: 'now_showing',
    releaseDate: '02 Jun 2023'
  },
  {
    id: 'tt4154796',
    title: 'Avengers: Endgame',
    year: '2019',
    runtime: '181 min',
    genres: ['Action', 'Adventure', 'Drama'],
    rating: '8.4',
    director: 'Anthony Russo, Joe Russo',
    cast: 'Robert Downey Jr., Chris Evans, Mark Ruffalo',
    description: 'After the devastating events of Infinity War, the universe is in ruins. The remaining Avengers assemble once more to reverse Thanos\' actions.',
    posterUrl: 'https://images.unsplash.com/photo-1560109947-543149eceb16?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1920&q=80',
    status: 'now_showing',
    releaseDate: '26 Apr 2019'
  },
  {
    id: 'tt1745960',
    title: 'Top Gun: Maverick',
    year: '2022',
    runtime: '130 min',
    genres: ['Action', 'Drama'],
    rating: '8.3',
    director: 'Joseph Kosinski',
    cast: 'Tom Cruise, Jennifer Connelly, Miles Teller',
    description: 'After thirty years, Maverick is still pushing the envelope as a top naval aviator, but must confront ghosts of his past when leading elite TOP GUN graduates.',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1519074069444-1ba4ea16e60b?auto=format&fit=crop&w=1920&q=80',
    status: 'now_showing',
    releaseDate: '27 May 2022'
  },
  {
    id: 'tt21235248',
    title: 'Gladiator II',
    year: '2024',
    runtime: '148 min',
    genres: ['Action', 'Adventure', 'Drama'],
    rating: '7.8',
    director: 'Ridley Scott',
    cast: 'Paul Mescal, Pedro Pascal, Denzel Washington',
    description: 'Years after witnessing the death of Maximus, Lucius must enter the Colosseum after the powerful emperors of Rome conquer his home.',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1920&q=80',
    status: 'upcoming',
    releaseDate: '22 Nov 2024'
  },
  {
    id: 'tt22022452',
    title: 'Inside Out 2',
    year: '2024',
    runtime: '96 min',
    genres: ['Animation', 'Adventure', 'Comedy'],
    rating: '7.6',
    director: 'Kelsey Mann',
    cast: 'Amy Poehler, Maya Hawke, Kensington Tallman',
    description: 'A teenage Riley begins experiencing brand-new emotions that take over Headquarters, leading to an adventure inside her growing mind.',
    posterUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80',
    status: 'upcoming',
    releaseDate: '14 Jun 2024'
  }
];

export const FEATURED_HERO_MOVIE = DEMO_MOVIES[0]; // Interstellar
