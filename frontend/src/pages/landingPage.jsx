// src/pages/LandingPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  MessageSquare,
  Zap,
  Shield,
  BarChart3,
  Crown,
  CheckCircle,
  Star,
  Users,
  Globe,
  Smartphone,
  Filter,
} from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <motion.div
              className="flex items-center space-x-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <MessageSquare className="h-8 w-8 text-purple-400" />
              <span className="text-xl font-bold text-white">TeleForward</span>
            </motion.div>

            <motion.div
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Link to="/login">
                <Button
                  variant="ghost"
                  className="text-white hover:text-purple-400"
                >
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  Get Started
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge
              variant="secondary"
              className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30"
            >
              <Zap className="mr-1 h-3 w-3" />
              Automate Your Telegram
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="text-white">Forward Messages</span>
              <br />
              <span className="gradient-text">Like Never Before</span>
            </h1>

            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Automate your Telegram message forwarding with smart filters,
              real-time analytics, and enterprise-grade reliability. Set it up
              once, let it run forever.
            </p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Link to="/register">
                <Button
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Watch Demo
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div className="text-center mb-16" {...fadeInUp}>
            <h2 className="text-4xl font-bold text-white mb-4">
              Powerful Features for Every Use Case
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              From simple forwarding to complex automation workflows, we've got
              everything you need.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 h-full">
                  <CardHeader>
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-purple-400" />
                    </div>
                    <CardTitle className="text-white">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-400">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-black/20">
        <div className="container mx-auto">
          <motion.div
            className="grid md:grid-cols-4 gap-8 text-center"
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {stats.map((stat, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <div className="text-4xl font-bold text-purple-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div className="text-center mb-16" {...fadeInUp}>
            <h2 className="text-4xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-400">
              Start free, upgrade when you need more power
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {/* Free Plan */}
            <motion.div variants={fadeInUp}>
              <Card className="bg-white/5 border-white/10 p-8">
                <CardHeader>
                  <CardTitle className="text-white text-2xl">Free</CardTitle>
                  <CardDescription className="text-gray-400">
                    Perfect for getting started
                  </CardDescription>
                  <div className="text-4xl font-bold text-white mt-4">
                    $0
                    <span className="text-lg font-normal text-gray-400">
                      /month
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {freePlanFeatures.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center text-gray-300"
                    >
                      <CheckCircle className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                  <Link to="/register" className="block">
                    <Button className="w-full mt-6" variant="outline">
                      Get Started Free
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* Premium Plan */}
            <motion.div variants={fadeInUp}>
              <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30 p-8 relative">
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600">
                  Most Popular
                </Badge>
                <CardHeader>
                  <CardTitle className="text-white text-2xl flex items-center">
                    <Crown className="h-6 w-6 text-yellow-400 mr-2" />
                    Premium
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Unlock unlimited potential
                  </CardDescription>
                  <div className="text-4xl font-bold text-white mt-4">
                    $9.99
                    <span className="text-lg font-normal text-gray-400">
                      /month
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {premiumPlanFeatures.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center text-gray-300"
                    >
                      <CheckCircle className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                  <Link to="/register" className="block">
                    <Button className="w-full mt-6 bg-purple-600 hover:bg-purple-700">
                      Start Premium Trial
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Automate Your Telegram?
            </h2>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              Join thousands of users who trust TeleForward to handle their
              message forwarding needs.
            </p>
            <Link to="/register">
              <Button
                size="lg"
                className="bg-white text-purple-600 hover:bg-gray-100 px-8"
              >
                Get Started Today
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-black/40 border-t border-white/10">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <MessageSquare className="h-6 w-6 text-purple-400" />
              <span className="text-lg font-semibold text-white">
                TeleForward
              </span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2024 TeleForward. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: Filter,
    title: "Smart Filtering",
    description:
      "Advanced keyword filtering with include/exclude rules. Forward only the messages that matter to you.",
  },
  {
    icon: Zap,
    title: "Real-time Forwarding",
    description:
      "Lightning-fast message forwarding with minimal delay. Your messages arrive instantly.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Detailed insights into your forwarding activity with charts, metrics, and performance data.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description:
      "End-to-end encryption and secure authentication. Your data stays private and protected.",
  },
  {
    icon: Globe,
    title: "Multi-Channel Support",
    description:
      "Connect unlimited channels and groups. Forward between public and private channels.",
  },
  {
    icon: Smartphone,
    title: "Mobile Optimized",
    description:
      "Fully responsive design that works perfectly on desktop, tablet, and mobile devices.",
  },
];

const stats = [
  { value: "10K+", label: "Active Users" },
  { value: "1M+", label: "Messages Forwarded" },
  { value: "99.9%", label: "Uptime" },
  { value: "24/7", label: "Support" },
];

const freePlanFeatures = [
  "Up to 3 forwarding rules",
  "Public channels only",
  "Basic filtering",
  "Community support",
  "Standard analytics",
];

const premiumPlanFeatures = [
  "Unlimited forwarding rules",
  "Private channels & groups",
  "Advanced filtering options",
  "Priority support",
  "Detailed analytics",
  "Custom webhooks",
  "Export capabilities",
];

export default LandingPage;
