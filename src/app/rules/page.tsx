import React from 'react';
import Head from 'next/head';

const RulesPage = () => {
  return (
    <>
      <Head>
        <title>PBEL City BT 2025 – Tournament Rules</title>
      </Head>
      <main className="max-w-6xl mx-auto py-12 px-4">
        {/* Enhanced Header */}
        <div className="text-center mb-12 animate-slide-in-up">
          <div className="text-5xl mb-4 animate-float">📋</div>
          <h1 className="text-4xl md:text-5xl font-bold text-white text-glow-white mb-4">
            Tournament Rules & Regulations
          </h1>
          <p className="text-white/80 text-xl max-w-3xl mx-auto">
            #PBELCityBT2025 – Complete tournament rules, regulations and important information
          </p>
        </div>

        <div className="space-y-8">
          {/* Available Categories */}
          <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-8 backdrop-blur-md border border-white/20 shadow-2xl animate-fade-in-scale">
            <div className="flex items-center mb-6">
              <div className="text-3xl mr-4">🏆</div>
              <h2 className="text-2xl font-bold text-white text-glow-white">Available Categories</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl p-6 border border-blue-200/30">
                <h3 className="text-xl font-bold text-white mb-4">Open Categories</h3>
                <ul className="space-y-2 text-white/90">
                  <li>• Men's Team*</li>
                  <li>• Women's Singles</li>
                  <li>• Women's Doubles</li>
                  <li>• Mixed Doubles</li>
                  <li>• Family Mixed Doubles</li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-2xl p-6 border border-green-200/30">
                <h3 className="text-xl font-bold text-white mb-4">Age Limited Categories</h3>
                <ul className="space-y-2 text-white/90">
                  <li>• Girls under 18 (Born on/after Jul 1st 2007)</li>
                  <li>• Girls under 13 (Born on/after Jul 1st 2012)</li>
                  <li>• Boys under 18 (Born on/after Jul 1st 2007)</li>
                  <li>• Boys under 13 (Born on/after Jul 1st 2012)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Men's Team Rules */}
          <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-8 backdrop-blur-md border border-white/20 shadow-2xl animate-fade-in-scale" style={{animationDelay: '0.1s'}}>
            <div className="flex items-center mb-6">
              <div className="text-3xl mr-4">👥</div>
              <h2 className="text-2xl font-bold text-white text-glow-white">Men's Team Category Rules</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3 text-white/90">
                <div className="flex items-start">
                  <span className="text-yellow-400 mr-3">•</span>
                  <span>Teams formed randomly and placed in pools</span>
                </div>
                <div className="flex items-start">
                  <span className="text-yellow-400 mr-3">•</span>
                  <span>Top two teams from each pool advance</span>
                </div>
                <div className="flex items-start">
                  <span className="text-yellow-400 mr-3">•</span>
                  <span>Each match has 5 games (singles & doubles)</span>
                </div>
              </div>
              <div className="space-y-3 text-white/90">
                <div className="flex items-start">
                  <span className="text-yellow-400 mr-3">•</span>
                  <span>Winning team (3 out of 5) gets 2 points</span>
                </div>
                <div className="flex items-start">
                  <span className="text-yellow-400 mr-3">•</span>
                  <span>Each player must play 1-2 games maximum</span>
                </div>
                <div className="flex items-start">
                  <span className="text-yellow-400 mr-3">•</span>
                  <span>Match forfeited if criteria not met</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tournament Info */}
          <div className="grid md:grid-cols-3 gap-6">
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
          <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-8 backdrop-blur-md border border-white/20 shadow-2xl animate-fade-in-scale" style={{animationDelay: '0.5s'}}>
            <div className="flex items-center mb-6">
              <div className="text-3xl mr-4">📝</div>
              <h2 className="text-2xl font-bold text-white text-glow-white">How to Register</h2>
            </div>
            <div className="space-y-4 text-white/90">
              <div className="flex items-center">
                <span className="text-green-400 mr-3">1.</span>
                <a href="https://forms.gle/7re3kC6XKK339piU6" className="text-blue-300 underline hover:text-blue-200 transition-colors" target="_blank">Register via Google Form</a>
              </div>
              <div className="flex items-start">
                <span className="text-green-400 mr-3">2.</span>
                <span>Have payment UPI ID, DOB proof, emergency contact, and T-shirt size ready</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-400 mr-3">3.</span>
                <span><strong>Deadline: June 30th, 2025</strong></span>
              </div>
            </div>
          </div>

          {/* Safety Guidelines */}
          <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-8 backdrop-blur-md border border-white/20 shadow-2xl animate-fade-in-scale" style={{animationDelay: '0.6s'}}>
            <div className="flex items-center mb-6">
              <div className="text-3xl mr-4">🛡️</div>
              <h2 className="text-2xl font-bold text-white text-glow-white">Safety Guidelines</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3 text-white/90">
                <div className="flex items-start">
                  <span className="text-red-400 mr-3">•</span>
                  <span>Stay away from playing area</span>
                </div>
                <div className="flex items-start">
                  <span className="text-red-400 mr-3">•</span>
                  <span>Parents must watch children</span>
                </div>
                <div className="flex items-start">
                  <span className="text-red-400 mr-3">•</span>
                  <span>Warm up properly and stay hydrated</span>
                </div>
              </div>
              <div className="space-y-3 text-white/90">
                <div className="flex items-start">
                  <span className="text-red-400 mr-3">•</span>
                  <span>Wear eye protection – <a href="https://injuryprevention.bmj.com/content/29/2/116" target="_blank" className="text-blue-300 underline">article 1</a>, <a href="https://bmcophthalmol.biomedcentral.com/articles/10.1186/s12886-023-02972-8" target="_blank" className="text-blue-300 underline">article 2</a></span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Rules */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-6 backdrop-blur-md border border-white/20 shadow-2xl animate-fade-in-scale" style={{animationDelay: '0.7s'}}>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">🎾 Draws & Format</h3>
                  <p className="text-white/80">Draws will be random. First round: 1 set to 30 points (no deuce). Later rounds: BWF format.</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">🏓 Service Rule</h3>
                  <p className="text-white/80">Waist-height traditional service rule (not BWF 1.15m).</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">⚖️ Conflict Resolution</h3>
                  <p className="text-white/80">Umpire decision is final. Organizers step in if required.</p>
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
                  <p className="text-white/80">Weekends: 8 AM–12 Noon and 4 PM–10 PM. Be there 15 minutes early.</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">🏅 Prize Distribution</h3>
                  <p className="text-white/80">Medals and prizes distributed during the closing ceremony. Date TBD.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Communication & Help */}
          <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-8 backdrop-blur-md border border-white/20 shadow-2xl animate-fade-in-scale" style={{animationDelay: '0.9s'}}>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white text-glow-white mb-2">Get Involved</h2>
              <p className="text-white/80">Join our community and help make this tournament a success!</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl mb-3">💬</div>
                <h3 className="text-lg font-bold text-white mb-2">Communication</h3>
                <a href="https://chat.whatsapp.com/D06juNcRmCE6QZbvcQMEFi" target="_blank" className="text-blue-300 underline hover:text-blue-200 transition-colors">Join WhatsApp Group</a>
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
