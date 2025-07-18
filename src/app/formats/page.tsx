'use client';

import { useEffect, useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { calculateStandings } from '@/lib/standingsUtils';
import { Pool, Player, PoolPlayer } from '@/types';
import type { Match as MatchType } from '@/types';

interface FormatData {
  category: string;
  description: string;
  rounds: Round[];
}

interface Round {
  name: string;
  matches: Array<{
    id: string;
    team1: string;
    team2: string;
    description?: string;
  }>;
}

// Helper to get top players for a category (e.g., GU13, BU18)
function useTopPlayersByPool(
  categoryCode: string,
  pools: Pool[],
  players: Player[],
  matches: MatchType[],
  poolPlayers: PoolPlayer[]
): Record<string, string> {
  const [topPlayers, setTopPlayers] = useState<Record<string, string>>({});

  useEffect(() => {
    const poolsForCategory = pools.filter((p: Pool) => p.category?.code === categoryCode);
    const result: Record<string, string> = {};
    poolsForCategory.forEach((pool: Pool, idx: number) => {
      const playerIds = poolPlayers.filter((pp: PoolPlayer) => pp.pool_id === pool.id).map((pp: PoolPlayer) => pp.player_id);
      const poolPlayersList = players.filter((p: Player) => playerIds.includes(p.id));
      const poolMatches = matches.filter((m: MatchType) => m.pool_id === pool.id);
      const standings = calculateStandings([], poolPlayersList, poolMatches, categoryCode);
      if (standings[0]) result[`${String.fromCharCode(65+idx)}1`] = standings[0].teamName;
      if (standings[1]) result[`${String.fromCharCode(65+idx)}2`] = standings[1].teamName;
    });
    setTopPlayers(result);
  }, [pools, players, matches, poolPlayers, categoryCode]);
  return topPlayers;
}

export default function FormatsPage() {
  const { pools, players, matches, poolPlayers } = useData();
  const gu13TopPlayers = useTopPlayersByPool('GU13', pools, players, matches as MatchType[], poolPlayers);
  const bu18TopPlayers = useTopPlayersByPool('BU18', pools, players, matches as MatchType[], poolPlayers);

  const tournamentFormats: FormatData[] = [
    {
      category: "MEN'S TEAM",
      description: "Top two teams from each group will proceed to QUARTERS.",
      rounds: [
        {
          name: "ROUND 1",
          matches: [
            { id: "Group A", team1: "", team2: "", description: "Team 1, Team 10, Team 13, Team 15" },
            { id: "Group B", team1: "", team2: "", description: "Team 11, Team 2, Team 7, Team 16" },
            { id: "Group C", team1: "", team2: "", description: "Team 9, Team 12, Team 14, Team 5" },
            { id: "Group D", team1: "", team2: "", description: "Team 3, Team 6, Team 8, Team 4" },
          ]
        },
        {
          name: "QUARTERS",
          matches: [
            { id: "MT-Q-M1", team1: "Top Team Group A", team2: "2nd Top Team Group D", description: "Quarter Final 1" },
            { id: "MT-Q-M2", team1: "Top Team Group B", team2: "2nd Top Team Group C", description: "Quarter Final 2" },
            { id: "MT-Q-M3", team1: "Top Team Group C", team2: "2nd Top Team Group A", description: "Quarter Final 3" },
            { id: "MT-Q-M4", team1: "Top Team Group D", team2: "2nd Top Team Group B", description: "Quarter Final 4" },
          ]
        },
        {
          name: "SEMIS",
          matches: [
            { id: "MT-S-M1", team1: "Winner MT-Q-M1", team2: "Winner MT-Q-M4", description: "Semi Final 1" },
            { id: "MT-S-M2", team1: "Winner MT-Q-M2", team2: "Winner MT-Q-M3", description: "Semi Final 2" },
          ]
        },
        {
          name: "FINALS",
          matches: [
            { id: "MT-FINALS", team1: "Winner MT-S-M1", team2: "Winner MT-S-M2", description: "Championship Final" },
          ]
        },
        {
          name: "THIRD POSITION MATCH",
          matches: [
            { id: "MT-TPM", team1: "Runner Up MT-S-M1", team2: "Runner Up MT-S-M2", description: "3rd Place Match" },
          ]
        }
      ]
    },
    {
      category: "WOMEN'S SINGLES",
      description: "Top 2 players from each group will proceed to QUARTERS.",
      rounds: [
        {
          name: "ROUND 1",
          matches: [
            { id: "Group A", team1: "", team2: "", description: "Saroja jampa, Monika Yadav, Upasana Maharana, Shiney Taneja" },
            { id: "Group B", team1: "", team2: "", description: "Srividya Rufus, Tanvisri, Anusha Busi, Susweta Mohanty" },
            { id: "Group C", team1: "", team2: "", description: "Tanvi M, Theja Sree, Apoorva, Khushi Atukuri" },
            { id: "Group D", team1: "", team2: "", description: "Manju, Priya paul, Swathi sinha, Swetha DB" },
          ]
        },
        {
          name: "QUARTERS",
          matches: [
            { id: "WS-Q-M1", team1: "Top Player Group A", team2: "2nd Top Player Group D", description: "Quarter Final 1" },
            { id: "WS-Q-M2", team1: "Top Player Group B", team2: "2nd Top Player Group A", description: "Quarter Final 2" },
            { id: "WS-Q-M3", team1: "Top Player Group C", team2: "2nd Top Player Group B", description: "Quarter Final 3" },
            { id: "WS-Q-M4", team1: "Top Player Group D", team2: "2nd Top Player Group C", description: "Quarter Final 4" },
          ]
        },
        {
          name: "SEMIS",
          matches: [
            { id: "WS-S-M1", team1: "Winner WS-Q-M1", team2: "Winner WS-Q-M4", description: "Semi Final 1" },
            { id: "WS-S-M2", team1: "Winner WS-Q-M2", team2: "Winner WS-Q-M3", description: "Semi Final 2" },
          ]
        },
        {
          name: "FINALS",
          matches: [
            { id: "WS-FINALS", team1: "Winner WS-S-M1", team2: "Winner WS-S-M2", description: "Championship Final" },
          ]
        },
        {
          name: "THIRD POSITION MATCH",
          matches: [
            { id: "WS-TPM", team1: "Runner Up WS-S-M1", team2: "Runner Up WS-S-M2", description: "3rd Place Match" },
          ]
        }
      ]
    },
    {
      category: "WOMEN'S DOUBLES",
      description: "Top 2 teams from each group will proceed to SEMIS.",
      rounds: [
        {
          name: "ROUND 1",
          matches: [
            { id: "Group A", team1: "", team2: "", description: "Swathi sinha / Saroja jampa, Manju / Preethi Kotari, Priya Paul / Hemlata Chauhan, Srilaya / Antara Sarkar" },
            { id: "Group B", team1: "", team2: "", description: "Ananya B / Lakshmi Amaleswari, Monika Yadav / Deepashna kapoor, Khushi Atukuri / Namrata Atukuri" },
          ]
        },
        {
          name: "SEMIS",
          matches: [
            { id: "WD-S-M1", team1: "Top Team Group A", team2: "Second top Team Group B", description: "Semi Final 1" },
            { id: "WD-S-M2", team1: "Top Team Group B", team2: "Second top Team Group A", description: "Semi Final 2" },
          ]
        },
        {
          name: "FINALS",
          matches: [
            { id: "WD-FINALS", team1: "Winner WD-S-M1", team2: "Winner WD-S-M2", description: "Championship Final" },
          ]
        },
        {
          name: "THIRD POSITION MATCH",
          matches: [
            { id: "WD-TPM", team1: "Runner Up WD-S-M1", team2: "Runner Up WD-S-M2", description: "3rd Place Match" },
          ]
        }
      ]
    },
    {
      category: "BOYS UNDER 13",
      description: "Top two players from each group will proceed to ROUND OF 16. Two 3rd placed players in total from all groups will proceed to ROUND OF 16 based on Points difference.",
      rounds: [
        {
          name: "ROUND 1",
          matches: [
            { id: "Group A", team1: "", team2: "", description: "Arnav Prakash, Purab, Vihaan BK, Taarush Pandit" },
            { id: "Group B", team1: "", team2: "", description: "Akhil Reddy Annapureddy, Arjun Bhattacharya, ShriAnsh Y, Praneesh Mandal" },
            { id: "Group C", team1: "", team2: "", description: "Darshith, Vibhuparikshith P, Divyansh Gupta" },
            { id: "Group D", team1: "", team2: "", description: "Kush Malik, Sashank Reddy Uppada, Kartik Srivastava" },
            { id: "Group E", team1: "", team2: "", description: "Sayooj Singh, Akhil Vadlamani, Vishnu Sathish, Angelo Abhinav" },
            { id: "Group F", team1: "", team2: "", description: "Kanireddy Hemanth Reddy, Mohammed Daniyal Ameen, Shivaan Selvan, Naeem Zakir" },
            { id: "Group G", team1: "", team2: "", description: "Suvaneesh Mandal, Arnav Mathur, Daksh H, Raphael Pothumudi" },
          ]
        },
        {
          name: "ROUND OF 16",
          matches: [
            { id: "B13-R16-M1", team1: "Top Player Group A", team2: "3rd Top Player 1", description: "Round of 16 Match 1" },
            { id: "B13-R16-M2", team1: "Top Player Group B", team2: "2nd Top Player Group D", description: "Round of 16 Match 2" },
            { id: "B13-R16-M3", team1: "Top Player Group C", team2: "2nd Top Player Group E", description: "Round of 16 Match 3" },
            { id: "B13-R16-M4", team1: "Top Player Group D", team2: "2nd Top Player Group F", description: "Round of 16 Match 4" },
            { id: "B13-R16-M5", team1: "Top Player Group E", team2: "2nd Top Player Group G", description: "Round of 16 Match 5" },
            { id: "B13-R16-M6", team1: "Top Player Group F", team2: "3rd Top Player 2", description: "Round of 16 Match 6" },
            { id: "B13-R16-M7", team1: "Top Player Group G", team2: "2nd Top Player Group A", description: "Round of 16 Match 7" },
            { id: "B13-R16-M8", team1: "2nd Top Player Group B", team2: "2nd Top Player Group C", description: "Round of 16 Match 8" },
          ]
        },
        {
          name: "QUARTERS",
          matches: [
            { id: "B13-Q-M1", team1: "Winner B13-R16-M1", team2: "Winner B13-R16-M8", description: "Quarter Final 1" },
            { id: "B13-Q-M2", team1: "Winner B13-R16-M2", team2: "Winner B13-R16-M7", description: "Quarter Final 2" },
            { id: "B13-Q-M3", team1: "Winner B13-R16-M3", team2: "Winner B13-R16-M6", description: "Quarter Final 3" },
            { id: "B13-Q-M4", team1: "Winner B13-R16-M4", team2: "Winner B13-R16-M5", description: "Quarter Final 4" },
          ]
        },
        {
          name: "SEMIS",
          matches: [
            { id: "B13-S-M1", team1: "Winner B13-Q-M1", team2: "Winner B13-Q-M4", description: "Semi Final 1" },
            { id: "B13-S-M2", team1: "Winner B13-Q-M2", team2: "Winner B13-Q-M3", description: "Semi Final 2" },
          ]
        },
        {
          name: "FINALS",
          matches: [
            { id: "B13-FINALS", team1: "Winner B13-S-M1", team2: "Winner B13-S-M2", description: "Championship Final" },
          ]
        },
        {
          name: "THIRD POSITION MATCH",
          matches: [
            { id: "B13-TPM", team1: "Runner Up B13-S-M1", team2: "Runner Up B13-S-M2", description: "3rd Place Match" },
          ]
        }
      ]
    },
    {
      category: "BOYS UNDER 18",
      description: "Top player from each group will proceed to SEMIS.",
      rounds: [
        {
          name: "ROUND 1",
          matches: [
            { id: "Group A", team1: "", team2: "", description: "Arnav Prakash, Rudra, Jeshua Nischal, Sohan Pendyala" },
            { id: "Group B", team1: "", team2: "", description: "Vaishnav Chandramohan Nair, Shiven Pathak, Akshith Vadde" },
            { id: "Group C", team1: "", team2: "", description: "Srinimadhur, Akshith, Joseph Ronald, Ashutosh Singh" },
            { id: "Group D", team1: "", team2: "", description: "Sukeerth Surisetty, Sashank Reddy, Darshith" },
          ]
        },
        {
          name: "QUARTERS",
          matches: [
            { id: "B18-Q-M1", team1: `${bu18TopPlayers['A1'] || 'A1'} (A1)`, team2: `${bu18TopPlayers['D2'] || 'D2'} (D2)`, description: "Quarter Final 1" },
            { id: "B18-Q-M2", team1: `${bu18TopPlayers['B1'] || 'B1'} (B1)`, team2: `${bu18TopPlayers['C2'] || 'C2'} (C2)`, description: "Quarter Final 2" },
            { id: "B18-Q-M3", team1: `${bu18TopPlayers['C1'] || 'C1'} (C1)`, team2: `${bu18TopPlayers['A2'] || 'A2'} (A2)`, description: "Quarter Final 3" },
            { id: "B18-Q-M4", team1: `${bu18TopPlayers['D1'] || 'D1'} (D1)`, team2: `${bu18TopPlayers['B2'] || 'B2'} (B2)`, description: "Quarter Final 4" },
          ]
        },
        {
          name: "SEMIS",
          matches: [
            { id: "B18-S-M1", team1: "Winner B18-Q-M1", team2: "Winner B18-Q-M4", description: "Semi Final 1" },
            { id: "B18-S-M2", team1: "Winner B18-Q-M2", team2: "Winner B18-Q-M3", description: "Semi Final 2" },
          ]
        },
        {
          name: "FINALS",
          matches: [
            { id: "B18-FINALS", team1: "Winner B18-S-M1", team2: "Winner B18-S-M2", description: "Championship Final" },
          ]
        },
        {
          name: "THIRD POSITION MATCH",
          matches: [
            { id: "B18-TPM", team1: "Runner Up B18-S-M1", team2: "Runner Up B18-S-M2", description: "3rd Place Match" },
          ]
        }
      ]
    },
    {
      category: "FAMILY MIXED DOUBLES",
      description: "Top two Teams from each group will proceed to ROUND OF 16. Four 3rd placed teams in total from all groups will proceed to ROUND OF 16 based on Points difference.",
      rounds: [
        {
          name: "ROUND 1",
          matches: [
            { id: "Group A", team1: "", team2: "", description: "Sraveen Kuchipudi / Dhruti Kuchipudi, Rajendra Kumar K / Uma Devi K, Athulya / Nandha Kumar, Aditi / Prashanth" },
            { id: "Group B", team1: "", team2: "", description: "Pratik Sahoo / Susweta Mohanty, Surya Karri / Sweta Padma, Suresh / Saindhavi Suresh, Vignesh / Ananya" },
            { id: "Group C", team1: "", team2: "", description: "Surender / Hemlata, Zakir Hussain / Rafa, Yagnanand / Smithi Das, Joydeep Bardhan / Tanvi M" },
            { id: "Group D", team1: "", team2: "", description: "Arushi Gupta / Shubham, Antara Sarkar / Indrajeet Pandit, Sara Bhat / Mahesh Kumar, Sai nithin / Anusha" },
            { id: "Group E", team1: "", team2: "", description: "Jawid Saj / Hafsa Nishaj, Sai Ramesh / Srilaya, Shashank Gupta / Ankita Gupta, Srikanth Tirandas / Aadhya Tirandas" },
            { id: "Group F", team1: "", team2: "", description: "Pratik / Manjusha, Veda T / T Balaji Sudhir, Srividya Rufus / Joseph Ronald, Priya Paul / Abraham Paul" },
          ]
        },
        {
          name: "ROUND OF 16",
          matches: [
            { id: "FMXD-R16-M1", team1: "Top Team Group A", team2: "2nd Top Team Group D", description: "Round of 16 Match 1" },
            { id: "FMXD-R16-M2", team1: "Top Team Group B", team2: "3rd Top Team 1", description: "Round of 16 Match 2" },
            { id: "FMXD-R16-M3", team1: "Top Team Group C", team2: "3rd Top Team 2", description: "Round of 16 Match 3" },
            { id: "FMXD-R16-M4", team1: "Top Team Group D", team2: "3rd Top Team 3", description: "Round of 16 Match 4" },
            { id: "FMXD-R16-M5", team1: "Top Team Group E", team2: "3rd Top Team 4", description: "Round of 16 Match 5" },
            { id: "FMXD-R16-M6", team1: "Top Team Group F", team2: "2nd Top Team Group C", description: "Round of 16 Match 6" },
            { id: "FMXD-R16-M7", team1: "2nd Top Team Group F", team2: "2nd Top Team Group B", description: "Round of 16 Match 7" },
            { id: "FMXD-R16-M8", team1: "2nd Top Team Group E", team2: "2nd Top Team Group A", description: "Round of 16 Match 8" },
          ]
        },
        {
          name: "QUARTERS",
          matches: [
            { id: "FMXD-Q-M1", team1: "Winner FMXD-R16-M1", team2: "Winner FMXD-R16-M8", description: "Quarter Final 1" },
            { id: "FMXD-Q-M2", team1: "Winner FMXD-R16-M2", team2: "Winner FMXD-R16-M7", description: "Quarter Final 2" },
            { id: "FMXD-Q-M3", team1: "Winner FMXD-R16-M3", team2: "Winner FMXD-R16-M6", description: "Quarter Final 3" },
            { id: "FMXD-Q-M4", team1: "Winner FMXD-R16-M4", team2: "Winner FMXD-R16-M5", description: "Quarter Final 4" },
          ]
        },
        {
          name: "SEMIS",
          matches: [
            { id: "FMXD-S-M1", team1: "Winner FMXD-Q-M1", team2: "Winner FMXD-Q-M4", description: "Semi Final 1" },
            { id: "FMXD-S-M2", team1: "Winner FMXD-Q-M2", team2: "Winner FMXD-Q-M3", description: "Semi Final 2" },
          ]
        },
        {
          name: "FINALS",
          matches: [
            { id: "FMXD-FINALS", team1: "Winner FMXD-S-M1", team2: "Winner FMXD-S-M2", description: "Championship Final" },
          ]
        },
        {
          name: "THIRD POSITION MATCH",
          matches: [
            { id: "FMXD-TPM", team1: "Runner Up FMXD-S-M1", team2: "Runner Up FMXD-S-M2", description: "3rd Place Match" },
          ]
        }
      ]
    },
    {
      category: "GIRLS UNDER 13",
      description: "Top player from each group will proceed to SEMI FINAL.",
      rounds: [
        {
          name: "ROUND 1",
          matches: [
            { id: "Group A", team1: "", team2: "", description: "Aditi pattamatta, Anya Anne Noronha, Sakshi Singh, Shanaya krishna" },
            { id: "Group B", team1: "", team2: "", description: "Kaushika Narayana, Intika Malik, Syed Izma" },
            { id: "Group C", team1: "", team2: "", description: "Myra Kona, Twisha Agarwal, Arisha Nishaj" },
            { id: "Group D", team1: "", team2: "", description: "Sahasra Rupavatharam, Shreya jampa, Saindhavi Suresh" },
          ]
        },
        {
          name: "QUARTERS",
          matches: [
            { id: "GU13-Q-M1", team1: `${gu13TopPlayers['A1'] || 'A1'} (A1)`, team2: `${gu13TopPlayers['D2'] || 'D2'} (D2)`, description: "Quarter Final 1" },
            { id: "GU13-Q-M2", team1: `${gu13TopPlayers['B1'] || 'B1'} (B1)`, team2: `${gu13TopPlayers['C2'] || 'C2'} (C2)`, description: "Quarter Final 2" },
            { id: "GU13-Q-M3", team1: `${gu13TopPlayers['C1'] || 'C1'} (C1)`, team2: `${gu13TopPlayers['A2'] || 'A2'} (A2)`, description: "Quarter Final 3" },
            { id: "GU13-Q-M4", team1: `${gu13TopPlayers['D1'] || 'D1'} (D1)`, team2: `${gu13TopPlayers['B2'] || 'B2'} (B2)`, description: "Quarter Final 4" },
          ]
        },
        {
          name: "SEMIS",
          matches: [
            { id: "GU13-S-M1", team1: "Winner GU13-Q-M1", team2: "Winner GU13-Q-M4", description: "Semi Final 1" },
            { id: "GU13-S-M2", team1: "Winner GU13-Q-M2", team2: "Winner GU13-Q-M3", description: "Semi Final 2" },
          ]
        },
        {
          name: "FINALS",
          matches: [
            { id: "GU13-FINALS", team1: "Winner GU13-S-M1", team2: "Winner GU13-S-M2", description: "Championship Final" },
          ]
        },
        {
          name: "THIRD POSITION MATCH",
          matches: [
            { id: "GU13-TPM", team1: "Runner Up GU13-S-M1", team2: "Runner Up GU13-S-M2", description: "3rd Place Match" },
          ]
        }
      ]
    },
    {
      category: "GIRLS UNDER 18",
      description: "Top two player from the group will proceed to FINALS. There is no bronze medal for this category only Winner and Runner.",
      rounds: [
        {
          name: "ROUND 1",
          matches: [
            { id: "Group A", team1: "", team2: "", description: "Hafsa Nishaj, Rafa, Ananya B, Veda T, Anya Mathur" },
          ]
        },
        {
          name: "FINALS",
          matches: [
            { id: "G18-FINALS", team1: "Top Player Group A", team2: "2nd Top Player Group A", description: "Championship Final" },
          ]
        }
      ]
    },
    {
      category: "MIXED DOUBLES",
      description: "Top two players from each group will proceed to QUARTERS.",
      rounds: [
        {
          name: "ROUND 1",
          matches: [
            { id: "Group A", team1: "", team2: "", description: "Khushi Atukuri / Pavan Atukuri, Akshat bhardwaj / Srilaya, Shubham / Arushi Gupta, Kavya Binwani / Sraveen Kuchipudi, Antara Sarkar / Visisht" },
            { id: "Group B", team1: "", team2: "", description: "Srividya Rufus / Joshua, Ajay Sharma / Namrata Atukuri, Priyanka Gali / Sonu Ram, Sai Ramesh / Preethi Kotari, Kambe Gowda / Sharada" },
            { id: "Group C", team1: "", team2: "", description: "Manju / Sumit Khatavkar, Abraham Paul / Anusha Busi, Shiney Taneja / Ram, Saroja jampa / Yagnanand, Surya Karri / Swathi sinha" },
            { id: "Group D", team1: "", team2: "", description: "Tanvisri / Srinivasreddy, Sanjay / Sunita, Kshitij Bhargava / Hemlata Chauhan, Cris / Balu" },
          ]
        },
        {
          name: "QUARTERS",
          matches: [
            { id: "MXD-Q-M1", team1: "Top Player Group A", team2: "2nd Top Player Group B", description: "Quarter Final 1" },
            { id: "MXD-Q-M2", team1: "Top Player Group B", team2: "2nd Top Player Group C", description: "Quarter Final 2" },
            { id: "MXD-Q-M3", team1: "Top Player Group C", team2: "2nd Top Player Group D", description: "Quarter Final 3" },
            { id: "MXD-Q-M4", team1: "Top Player Group D", team2: "2nd Top Player Group A", description: "Quarter Final 4" },
          ]
        },
        {
          name: "SEMIS",
          matches: [
            { id: "MXD-S-M1", team1: "Winner MXD-Q-M1", team2: "Winner MXD-Q-M4", description: "Semi Final 1" },
            { id: "MXD-S-M2", team1: "Winner MXD-Q-M2", team2: "Winner MXD-Q-M3", description: "Semi Final 2" },
          ]
        },
        {
          name: "FINALS",
          matches: [
            { id: "MXD-FINALS", team1: "Winner MXD-S-M1", team2: "Winner MXD-S-M2", description: "Championship Final" },
          ]
        },
        {
          name: "THIRD POSITION MATCH",
          matches: [
            { id: "MXD-TPM", team1: "Runner Up MXD-S-M1", team2: "Runner Up MXD-S-M2", description: "3rd Place Match" },
          ]
        }
      ]
    },
  ];

  const [selectedCategory, setSelectedCategory] = useState<string>(tournamentFormats[0].category);

  const selectedFormat = tournamentFormats.find(format => format.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Tournament Formats
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Explore the tournament structure and match formats for all categories in the PBEL Badminton Tournament 2025
            </p>
          </div>
        </div>
      </div>

      {/* Category Selector */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {tournamentFormats.map((format) => (
            <button
              key={format.category}
              onClick={() => setSelectedCategory(format.category)}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                selectedCategory === format.category
                  ? 'bg-white text-blue-900 shadow-lg scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
              }`}
            >
              {format.category}
            </button>
          ))}
        </div>

        {/* Format Display */}
        {selectedFormat && (
          <div className="space-y-8">
            {/* Category Header */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-4">{selectedFormat.category}</h2>
              <p className="text-lg text-white/80 max-w-2xl mx-auto">{selectedFormat.description}</p>
            </div>

            {/* Tournament Bracket */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <div className="space-y-12">
                {selectedFormat.rounds.map((round, roundIndex) => (
                  <div key={`${selectedFormat.category}-${round.name}-${roundIndex}`} className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-white mb-2">{round.name}</h3>
                      <div className="h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full w-32 mx-auto"></div>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {round.matches.map((match, matchIndex) => (
                        <div key={`${selectedFormat.category}-${round.name}-${match.id}-${matchIndex}`} className="bg-white/10 rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200">
                          <div className="text-center mb-3">
                            <span className="text-xs font-medium text-white/70 bg-white/10 px-2 py-1 rounded">
                              {match.id}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {match.team1 || match.team2 ? (
                              <>
                                <div className="text-sm font-medium text-white text-center">{match.team1}</div>
                                <div className="text-xs text-white/50 text-center">vs</div>
                                <div className="text-sm font-medium text-white text-center">{match.team2}</div>
                              </>
                            ) : null}
                            {match.description && (
                              <div className="mt-2">
                                <ul className="text-sm text-white/80 text-left space-y-1">
                                  {match.description.split(', ').map((player, index) => (
                                    <li key={index} className="flex items-center">
                                      <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 flex-shrink-0"></span>
                                      {player.trim()}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tournament Info */}
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl p-8 border border-blue-200/30">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-4">Tournament Information</h3>
                <div className="grid md:grid-cols-3 gap-6 text-white/80">
                  <div>
                    <h4 className="font-semibold text-white mb-2">Format</h4>
                    <p>See above for each category</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Scoring</h4>
                    <p>Best of 3 games (21 points)</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Advancement</h4>
                    <p>Winners advance to next round</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 