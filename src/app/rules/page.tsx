const RulesPage = () => {
  return (
    <>
      <main className="max-w-6xl mx-auto py-12 px-4">
        {/* Enhanced Header */}
        <div className="text-center mb-12 animate-slide-in-up">
          <div className="text-5xl mb-4 animate-float">📋</div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Tournament Rules & Regulations
          </h1>
          <p className="text-white/80 text-xl max-w-3xl mx-auto">
            #PBELCityBT2025 – Complete tournament rules, regulations and important information
          </p>
        </div>

        <div className="space-y-8">
          {/* Available Categories */}
          <div id="categories" className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-8 backdrop-blur-md border border-white/20 shadow-2xl animate-fade-in-scale">
            <div className="flex items-center mb-6">
              <div className="text-3xl mr-4">🏆</div>
              <h2 className="text-2xl font-bold text-white">Available Categories</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl p-6 border border-blue-200/30">
                <h3 className="text-xl font-bold text-white mb-4">Open Categories</h3>
                <ul className="space-y-2 text-white/90">
                  <li>&bull; Men&apos;s Team*</li>
                  <li>&bull; Women&apos;s Singles</li>
                  <li>&bull; Women&apos;s Doubles</li>
                  <li>&bull; Mixed Doubles</li>
                  <li>&bull; Family Mixed Doubles (Wife-Husband, Father-Daughter, Mother-Son, Brother-Sister)</li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-2xl p-6 border border-green-200/30">
                <h3 className="text-xl font-bold text-white mb-4">Age Limited Categories</h3>
                <ul className="space-y-2 text-white/90">
                  <li>&bull; Girls under 18 (Born on/after Jul 1st 2007 and on/before Jul 1st 2012)</li>
                  <li>&bull; Girls under 13 (Born on/after Jul 1st 2012)</li>
                  <li>&bull; Boys under 18 (Born on/after Jul 1st 2007 and on/before Jul 1st 2012)</li>
                  <li>&bull; Boys under 13 (Born on/after Jul 1st 2012)</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 p-4 bg-yellow-500/20 rounded-2xl border border-yellow-200/30">
              <div className="flex items-start">
                <span className="text-yellow-400 mr-3 text-lg">&#9888;&#65039;</span>
                <div className="text-white/90">
                  <p className="font-semibold mb-2">Important:</p>
                  <ul className="space-y-1 text-sm">
                    <li>&bull; One player is allowed in maximum of 3 categories only</li>
                    <li>&bull; Only valid DoB proof are Aadhar card, Passport and DoB Certificate issued by State Govts.</li>
                    <li>&bull; Only the residents of PBEL City are allowed to participate in the tournament. Any violation found to this rule will result in disqualification</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Men's Team Rules */}
          <div id="mens-team" className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-8 backdrop-blur-md border border-white/20 shadow-2xl animate-fade-in-scale" style={{animationDelay: '0.1s'}}>
            <div className="flex items-center mb-6">
              <div className="text-3xl mr-4">👥</div>
              <h2 className="text-2xl font-bold text-white">Important Rules and Info for Men’s Team Category</h2>
            </div>
            <div className="space-y-4 text-white/90">
              <ul className="list-disc pl-6 space-y-2">
                <li>For this category, the players will be divided into teams</li>
                <li>The team formation will be done purely on random basis</li>
                <li>The teams will be placed into different pools and each team will be competing against other teams in the same pool</li>
                <li>After the completion of the league round, the top two placed teams in each pool will proceed to the next round</li>
                <li>If two or more teams have the same points at the end of the league round, the team having higher number of games won difference (games won - games lost) will proceed to the next round</li>
                <li>If the games won difference is also the same for two or more teams, then teams having a better point difference (point scored - points against) will proceed to the next round</li>
                <li>Each match between two teams will comprise of combination of multiple singles and doubles games</li>
                <li>The team winning a greater number of games will be awarded 2 points</li>
                <li>Example (only for illustration purposes): Team A vs Team B will have the following games (actual number of games for team match may vary)
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Singles 1</li>
                    <li>Doubles 1</li>
                    <li>Doubles 2</li>
                    <li>Singles 2</li>
                    <li>Doubles 3</li>
                  </ul>
                  To win the points, either team needs to win 3 out of these 5 games.
                </li>
                <li>Each player in the team should participate in at least one game of every team match</li>
                <li>A player can play not more than 2 games of every team match. However, a maximum of 2 players can play 2 games in a team match while still ensuring all the available team members play at least one game.</li>
                <li>A player can play only 1 singles</li>
                <li>A doubles pair cannot be repeated.</li>
                <li>In cases of non-availability of a player (only upto 1 player), a third player can play 2 games</li>
                <li>If the team is unable to fulfil all the above criteria, the respective game(s) will be forfeited to the other team.</li>
                <li>The team will need to declare the players’ names for each game before the start of each match</li>
                <li>Teams should ensure everyone’s availability as per the scheduled time slot as shared by the organizing team. Failing to be available for the match at the scheduled time may result in forfeiting of the respective game where the players are unavailable.</li>
              </ul>
              <div className="mt-6 p-4 bg-yellow-500/20 rounded-2xl border border-yellow-200/30">
                <div className="flex items-start">
                  <span className="text-yellow-400 mr-3 text-lg">&#9888;&#65039;</span>
                  <div className="text-white/90">
                    <p className="font-semibold mb-2">Important:</p>
                    <ul className="space-y-1 text-sm list-disc pl-6">
                      <li>&bull; One player is allowed in maximum of 3 categories only</li>
                      <li>&bull; Only valid DoB proof are Aadhar card, Passport and DoB Certificate issued by State Govts.</li>
                      <li>&bull; Only the residents of PBEL City are allowed to participate in the tournament. Any violation found to this rule will result in disqualification</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tournament Info */}
          <div id="tournament-info" className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-6 backdrop-blur-md border border-white/20 shadow-2xl animate-fade-in-scale" style={{animationDelay: '0.2s'}}>
              <div className="text-center">
                <div className="text-3xl mb-4">📅</div>
                <h3 className="text-xl font-bold text-white mb-3">Tournament Dates</h3>
                <p className="text-white/80">Weekend matches from <strong>July 12th to August 10th, 2025</strong></p>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-6 backdrop-blur-md border border-white/20 shadow-2xl animate-fade-in-scale" style={{animationDelay: '0.3s'}}>
              <div className="text-center">
                <div className="text-3xl mb-4">💰</div>
                <h3 className="text-xl font-bold text-white mb-3">Registration Fee</h3>
                <p className="text-white/80">Rs. 600 for first category<br/>Rs. 300 for each additional</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-6 backdrop-blur-md border border-white/20 shadow-2xl animate-fade-in-scale" style={{animationDelay: '0.4s'}}>
              <div className="text-center">
                <div className="text-3xl mb-4">👥</div>
                <h3 className="text-xl font-bold text-white mb-3">Minimum Participation</h3>
                <p className="text-white/80">Minimum 8 entries per category required. Refunds provided if canceled.</p>
              </div>
            </div>
          </div>

          {/* Registration */}
          <div id="registration" className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-8 backdrop-blur-md border border-white/20 shadow-2xl animate-fade-in-scale" style={{animationDelay: '0.5s'}}>
            <div className="flex items-center mb-6">
              <div className="text-3xl mr-4">📝</div>
              <h2 className="text-2xl font-bold text-white">How to Register</h2>
            </div>
            <div className="space-y-4 text-white/90">
              <div className="flex items-center">
                <span className="text-green-400 mr-3">1.</span>
                <a href="https://docs.google.com/forms/d/e/1FAIpQLSc8U4-KqWzDRl-n_afvn14LpMhdM5_qr3d-xVF9IxOhCBRh8Q/viewform" className="text-blue-300 underline hover:text-blue-200 transition-colors" target="_blank">Register via Google Form</a>
                <span className="ml-2 text-white/70">(Register separately for each category)</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-400 mr-3">2.</span>
                <span>Have ready: categories, UPI transaction ID, T-shirt size, name, flat#, contact#, emergency contact#, valid DOB proof</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-400 mr-3">3.</span>
                <span><strong>Deadline: June 30th, 2025</strong></span>
              </div>
            </div>
          </div>

          {/* Safety Guidelines */}
          <div id="safety" className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-8 backdrop-blur-md border border-white/20 shadow-2xl animate-fade-in-scale" style={{animationDelay: '0.6s'}}>
            <div className="flex items-center mb-6">
              <div className="text-3xl mr-4">🛡️</div>
              <h2 className="text-2xl font-bold text-white">Safety Guidelines</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3 text-white/90">
                <div className="flex items-start">
                  <span className="text-red-400 mr-3">•</span>
                  <span>Stay away from playing area - tight facility space</span>
                </div>
                <div className="flex items-start">
                  <span className="text-red-400 mr-3">•</span>
                  <span>Parents must watch children - prevent running around playing areas</span>
                </div>
                <div className="flex items-start">
                  <span className="text-red-400 mr-3">•</span>
                  <span>Warm up properly to prevent injuries</span>
                </div>
                <div className="flex items-start">
                  <span className="text-red-400 mr-3">•</span>
                  <span>Stay hydrated to prevent fatigue and cramps</span>
                </div>
              </div>
              <div className="space-y-3 text-white/90">
                <div className="flex items-start">
                  <span className="text-red-400 mr-3">•</span>
                  <span>Wear eye protection – <a href="https://injuryprevention.bmj.com/content/29/2/116" target="_blank" className="text-blue-300 underline">article 1</a>, <a href="https://bmcophthalmol.biomedcentral.com/articles/10.1186/s12886-023-02972-8" target="_blank" className="text-blue-300 underline">article 2</a></span>
                </div>
                <div className="flex items-start">
                  <span className="text-red-400 mr-3">•</span>
                  <span>Provide emergency contact number</span>
                </div>
                <div className="flex items-start">
                  <span className="text-red-400 mr-3">•</span>
                  <span>Note: Tournament has no additional medical facility</span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Rules */}
          <div id="additional" className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-6 backdrop-blur-md border border-white/20 shadow-2xl animate-fade-in-scale" style={{animationDelay: '0.7s'}}>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">🎾 Draws & Format</h3>
                  <p className="text-white/80">Draws will be randomized.</p>
                  <p className="text-white/80">Rounds 1, 2 (Round of 16), and Quarterfinals: Single set to <strong>30</strong> points, no deuce.</p>
                  <p className="text-white/80">From Semifinals onwards: Matches will follow BWF format — best of <strong>3</strong> sets, each set to <strong>21</strong> points.</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">🏓 Service Rule</h3>
                  <p className="text-white/80">Waist-height traditional service rule (not BWF 1.15m).</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">⚖️ Conflict Resolution</h3>
                  <p className="text-white/80">Umpire decision is final. Organizers step in if required.</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">⏰ Punctuality</h3>
                  <p className="text-white/80">Be available 15 mins ahead of schedule. No rescheduling requests entertained.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-6 backdrop-blur-md border border-white/20 shadow-2xl animate-fade-in-scale" style={{animationDelay: '0.8s'}}>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">🏸 Shuttle Type</h3>
                  <p className="text-white/80">Mavis 350 plastic shuttles.</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">⏰ Match Timings</h3>
                  <p className="text-white/80">Weekends: 8 AM–12 Noon and 4 PM–10 PM.</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">👕 T-Shirt</h3>
                  <p className="text-white/80">All players get one T-shirt (size provided during registration).</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">🏅 Prize Distribution</h3>
                  <p className="text-white/80">Medals and prizes distributed during the closing ceremony. Date TBD.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Communication & Help */}
          <div id="help" className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-8 backdrop-blur-md border border-white/20 shadow-2xl animate-fade-in-scale" style={{animationDelay: '0.9s'}}>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Get Involved</h2>
              <p className="text-white/80">Join our community and help make this tournament a success!</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl mb-3">💬</div>
                <h3 className="text-lg font-bold text-white mb-2">Communication</h3>
                <a href="https://chat.whatsapp.com/D06juNcRmCE6QZbvcQMEFi" target="_blank" className="text-blue-300 underline hover:text-blue-200 transition-colors">Join Players WhatsApp Group</a>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">🤝</div>
                <h3 className="text-lg font-bold text-white mb-2">Volunteering</h3>
                <p className="text-white/80">Reach out to organizers to volunteer</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">📢</div>
                <h3 className="text-lg font-bold text-white mb-2">Spread the Word</h3>
                <p className="text-white/80">Use <strong>#PBELCityBT2025</strong> on social media</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default RulesPage;
