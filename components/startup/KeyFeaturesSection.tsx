"use client";

import type { ComponentType } from "react";
import { 
  Zap, Shield, Rocket, Globe, Users, Smartphone, CheckCircle, Star, Heart, 
  Activity, TrendingUp, Award, Key, Lock, Cloud, Server, Database, Cpu, Code, Monitor,
  type LucideProps
} from "lucide-react";

type Feature = {
  icon: string;
  title: string;
  description: string;
};

const iconMap: Record<string, ComponentType<LucideProps>> = {
  Zap, Shield, Rocket, Globe, Users, Smartphone, CheckCircle, Star, Heart,
  Activity, TrendingUp, Award, Key, Lock, Cloud, Server, Database, Cpu, Code, Monitor
};

export default function KeyFeaturesSection({ features }: { features?: Feature[] }) {
  if (!features || features.length === 0) return null;

  return (
    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm mb-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-coral-50 rounded-xl flex items-center justify-center text-coral-500">
          <Zap className="w-5 h-5 fill-current" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 font-heading">Key Features</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, idx) => {
          const IconComponent = iconMap[feature.icon] || Zap;
          return (
            <div key={idx} className="p-6 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors group">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-gray-700 shadow-sm border border-gray-100 mb-4 group-hover:text-coral-500 transition-colors">
                <IconComponent className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
