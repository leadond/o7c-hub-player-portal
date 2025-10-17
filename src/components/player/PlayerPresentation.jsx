import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Star, Trophy, School, TrendingUp, Award, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getCollegeLogo, getOfficialName, logosDataPromise } from "@/utils/collegeLogos";

export default function PlayerPresentation({ player, onClose }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [logosData, setLogosData] = useState(null);

  useEffect(() => {
    logosDataPromise.then(setLogosData).catch(console.error);
  }, []);

  const slides = [
    // Slide 1: Welcome
    {
      type: "hero",
      title: `Welcome, ${player.firstName}!`,
      subtitle: "Your Journey to Greatness Starts Here",
      content: (
        <div className="text-center">
          <div className="w-48 h-48 mx-auto mb-8 rounded-full overflow-hidden border-8 border-white shadow-2xl">
            {player.photo_url ? (
              <img src={player.photo_url} alt={player.firstName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-6xl font-bold text-blue-900">
                {player.firstName[0]}{player.lastName[0]}
              </div>
            )}
          </div>
          <h2 className="text-5xl font-bold text-white mb-4">
            {player.firstName} {player.lastName}
          </h2>
          <div className="inline-block bg-white/20 backdrop-blur-sm px-8 py-4 rounded-2xl">
            <p className="text-2xl font-bold text-white">
              {player.position} • Class of {player.class}
            </p>
          </div>
        </div>
      ),
      bg: "from-blue-900 via-blue-800 to-blue-900"
    },
    
    // Slide 2: Player Profile
    {
      type: "stats",
      title: "Your Athletic Profile",
      icon: Trophy,
      content: (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/20">
            <p className="text-blue-200 text-sm mb-2">Position</p>
            <p className="text-4xl font-bold text-white">{player.position}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/20">
            <p className="text-blue-200 text-sm mb-2">Class</p>
            <p className="text-4xl font-bold text-white">{player.class}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/20">
            <p className="text-blue-200 text-sm mb-2">Height</p>
            <p className="text-4xl font-bold text-white">{player.height || 'N/A'}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/20">
            <p className="text-blue-200 text-sm mb-2">Weight</p>
            <p className="text-4xl font-bold text-white">{player.weight || 'N/A'} lbs</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/20 col-span-2">
            <p className="text-blue-200 text-sm mb-3">Star Rating</p>
            <div className="flex justify-center gap-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-10 h-10 ${
                    i < (player.stars || 3) ? "text-yellow-400 fill-yellow-400" : "text-white/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      ),
      bg: "from-indigo-900 via-indigo-800 to-blue-900"
    },

    // Slide 3: High School
    {
      type: "school",
      title: "Your High School",
      icon: School,
      content: (
        <div className="text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-12 border-2 border-white/20 mb-8">
            <School className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
            <h3 className="text-5xl font-bold text-white mb-4">{player.highSchool}</h3>
            {player.highSchoolJerseyNumber && (
              <div className="inline-block bg-yellow-400 text-blue-900 px-8 py-3 rounded-xl font-bold text-2xl">
                Jersey #{player.highSchoolJerseyNumber}
              </div>
            )}
          </div>
          {player.region && (
            <p className="text-2xl text-blue-200">
              <span className="font-bold text-white">Region:</span> {player.region}
            </p>
          )}
        </div>
      ),
      bg: "from-purple-900 via-purple-800 to-indigo-900"
    },

    // Slide 4: Recruitment Status
    {
      type: "recruitment",
      title: "Your Recruitment Journey",
      icon: TrendingUp,
      content: (
        <div className="space-y-6">
          {player.commitment ? (
            <div className="bg-emerald-500 rounded-3xl p-12 text-center">
              {(() => {
                const logoUrl = logosData ? getCollegeLogo(logosData, player.commitment) : null;
                return logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={`${player.commitment} logo`}
                    className="w-20 h-20 object-contain mx-auto mb-4"
                    onError={(e) => console.error('Img load error for', player.commitment, e)}
                  />
                ) : (
                  <Award className="w-16 h-16 text-white mx-auto mb-4" />
                );
              })()}
              <p className="text-2xl text-white mb-2">Committed to</p>
              <h3 className="text-5xl font-bold text-white">{logosData ? getOfficialName(logosData, player.commitment) : player.commitment}</h3>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border-2 border-white/20 text-center">
                <p className="text-blue-200 text-xl mb-3">College Offers</p>
                <p className="text-6xl font-bold text-yellow-400">{player.offers || 0}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border-2 border-white/20 text-center">
                <p className="text-blue-200 text-xl mb-3">Star Rating</p>
                <p className="text-6xl font-bold text-yellow-400">{player.stars || 3}⭐</p>
              </div>
            </div>
          )}
          
          {player.o7cTeam && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border-2 border-white/20 text-center">
              <p className="text-blue-200 text-xl mb-3">O7C Team</p>
              <p className="text-4xl font-bold text-white">{player.o7cTeam}</p>
              {player.ohioPlayersJerseyNumber && (
                <p className="text-2xl text-yellow-400 mt-2">Jersey #{player.ohioPlayersJerseyNumber}</p>
              )}
            </div>
          )}
        </div>
      ),
      bg: "from-blue-900 via-cyan-800 to-teal-900"
    },

    // Slide 5: Why O7C
    {
      type: "whyo7c",
      title: "Why Ohio 7 on 7 Collective?",
      icon: Target,
      content: (
        <div className="space-y-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-2xl font-bold text-white mb-2">Elite Competition</h4>
                <p className="text-blue-200 text-lg">Compete against the best talent in Ohio and showcase your skills to college scouts nationwide.</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-2xl font-bold text-white mb-2">Expert Coaching</h4>
                <p className="text-blue-200 text-lg">Learn from experienced coaches who have developed NCAA Division I and NFL players.</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-2xl font-bold text-white mb-2">Maximum Exposure</h4>
                <p className="text-blue-200 text-lg">Get noticed through showcases, tournaments, and direct connections with college recruiters.</p>
              </div>
            </div>
          </div>
        </div>
      ),
      bg: "from-emerald-900 via-teal-800 to-cyan-900"
    },

    // Slide 6: Next Steps
    {
      type: "cta",
      title: "Your Path to Success",
      icon: Target,
      content: (
        <div className="text-center">
          <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-8" />
          <h3 className="text-4xl font-bold text-white mb-6">
            Ready to Take Your Game to the Next Level?
          </h3>
          <p className="text-2xl text-blue-200 mb-8 max-w-3xl mx-auto leading-relaxed">
            Join the Ohio 7 on 7 Collective and become part of Ohio's premier football development program.
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border-2 border-white/20 max-w-2xl mx-auto">
            <h4 className="text-2xl font-bold text-white mb-4">Contact Your O7C Representative</h4>
            <p className="text-xl text-blue-200">
              Questions? We're here to help you every step of the way.
            </p>
            <p className="text-lg text-yellow-400 mt-4 font-bold">
              info@ohio7on7.com
            </p>
          </div>
        </div>
      ),
      bg: "from-blue-900 via-blue-800 to-indigo-900"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="max-w-6xl w-full h-[80vh] relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className={`w-full h-full bg-gradient-to-br ${currentSlideData.bg} rounded-3xl shadow-2xl p-12 flex flex-col justify-center overflow-y-auto`}
          >
            {/* Slide Header */}
            <div className="text-center mb-8">
              {currentSlideData.icon && (
                <currentSlideData.icon className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              )}
              <h2 className="text-5xl font-bold text-white mb-4">{currentSlideData.title}</h2>
              {currentSlideData.subtitle && (
                <p className="text-2xl text-blue-200">{currentSlideData.subtitle}</p>
              )}
            </div>

            {/* Slide Content */}
            <div className="flex-1 flex items-center justify-center">
              {currentSlideData.content}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="absolute bottom-8 left-0 right-0 flex items-center justify-between px-12">
          <button
            onClick={prevSlide}
            className="w-14 h-14 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <div className="flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-3 rounded-full transition-all ${
                  index === currentSlide
                    ? "w-12 bg-white"
                    : "w-3 bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            className="w-14 h-14 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>

        {/* Slide Counter */}
        <div className="absolute top-8 left-0 right-0 text-center">
          <span className="text-white/60 text-lg font-medium">
            {currentSlide + 1} / {slides.length}
          </span>
        </div>
      </div>
    </div>
  );
}