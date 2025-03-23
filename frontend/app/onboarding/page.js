"use client";

import {
  Activity,
  Airplay,
  Anchor,
  Aperture,
  Book,
  Briefcase,
  Camera,
  Car,
  ChefHat,
  Coffee,
  Euro,
  Film,
  Heart,
  Home,
  Music,
  Plane,
  ShoppingCart,
  Wrench,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import Stepper, { Step } from "../components/ui/stepper";
import { supabase } from "../lib/supabaseClient";
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const availableIcons = [
  "IconRestaurant",
  "IconCar",
  "IconShoppingCart",
  "IconHome",
  "IconHealth",
  "IconCoffee",
  "IconBriefcase",
  "IconDollarSign",
  "IconActivity",
  "IconAirplay",
  "IconAnchor",
  "IconAperture",
  "IconBook",
  "IconCamera",
  "IconMusic",
  "IconFilm",
  "IconWrench",
  "IconPlane",
];

const iconMapping = {
  IconRestaurant: ChefHat,
  IconCar: Car,
  IconShoppingCart: ShoppingCart,
  IconHome: Home,
  IconHealth: Heart,
  IconCoffee: Coffee,
  IconBriefcase: Briefcase,
  IconDollarSign: Euro,
  IconActivity: Activity,
  IconAirplay: Airplay,
  IconAnchor: Anchor,
  IconAperture: Aperture,
  IconBook: Book,
  IconCamera: Camera,
  IconMusic: Music,
  IconFilm: Film,
  IconWrench: Wrench,
  IconPlane: Plane,
};

const predefinedExpenseCategories = [
  { name: "Food", icon: "IconRestaurant" },
  { name: "Transport", icon: "IconCar" },
  { name: "Shopping", icon: "IconShoppingCart" },
  { name: "Housing", icon: "IconHome" },
  { name: "Health", icon: "IconHealth" },
  { name: "Other", icon: "IconWrench" },
];

const predefinedIncomeCategories = [
  { name: "Salary", icon: "IconDollarSign" },
  { name: "Freelance", icon: "IconBriefcase" },
  { name: "Other", icon: "IconWrench" },
];

export default function Onboarding() {
  const router = useRouter();
  const [initialBalance, setInitialBalance] = useState("0");
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [incomeCategories, setIncomeCategories] = useState([]);

  // States for custom category creation
  const [customExpenseName, setCustomExpenseName] = useState("");
  const [customExpenseIcon, setCustomExpenseIcon] = useState("");
  const [customIncomeName, setCustomIncomeName] = useState("");
  const [customIncomeIcon, setCustomIncomeIcon] = useState("");
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/login");
      }
    };
    checkSession();
  }, [router]);

  const handleStepChange = (newStep) => {
    // Only validate when moving forward
    if (newStep > currentStep) {
      if (currentStep === 1) {
        const balance = parseInt(initialBalance, 10);
        if (isNaN(balance) || balance < 0) {
          alert("Please enter a valid positive initial balance.");
          return;
        }
      } else if (currentStep === 2) {
        if (expenseCategories.length === 0) {
          alert("Please select at least one expense category.");
          return;
        }
      }
    }
    setCurrentStep(newStep);
  };

  const handleNextClick = () => {
    if (currentStep === 1) {
      const balance = parseInt(initialBalance, 10);
      if (isNaN(balance) || balance < 0) {
        alert("Please enter a valid positive initial balance.");
        return;
      }
    } else if (currentStep === 2) {
      if (expenseCategories.length === 0) {
        alert("Please select at least one expense category.");
        return;
      }
    } else if (currentStep === 3) {
      if (incomeCategories.length === 0) {
        alert("Please select at least one income category.");
        return;
      }
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      submitOnboarding();
    }
  };

  // Handlers for selecting predefined categories
  const handleSelectExpenseCategory = (categoryName) => {
    const category = predefinedExpenseCategories.find(
      (cat) => cat.name === categoryName
    );
    if (category && !expenseCategories.some((c) => c.name === category.name)) {
      setExpenseCategories((prev) => [...prev, category]);
    }
  };

  const handleSelectIncomeCategory = (categoryName) => {
    const category = predefinedIncomeCategories.find(
      (cat) => cat.name === categoryName
    );
    if (category && !incomeCategories.some((c) => c.name === category.name)) {
      setIncomeCategories((prev) => [...prev, category]);
    }
  };

  // Handlers for adding custom categories
  const addCustomExpenseCategory = () => {
    if (customExpenseName && customExpenseIcon) {
      setExpenseCategories((prev) => [
        ...prev,
        {
          name:
            customExpenseName.charAt(0).toUpperCase() +
            customExpenseName.slice(1).toLowerCase(),
          icon: customExpenseIcon,
        },
      ]);
      setCustomExpenseName("");
      setCustomExpenseIcon("");
    }
  };

  const addCustomIncomeCategory = () => {
    if (customIncomeName && customIncomeIcon) {
      setIncomeCategories((prev) => [
        ...prev,
        {
          name:
            customIncomeName.charAt(0).toUpperCase() +
            customIncomeName.slice(1).toLowerCase(),
          icon: customIncomeIcon,
        },
      ]);
      setCustomIncomeName("");
      setCustomIncomeIcon("");
    }
  };

  const submitOnboarding = async () => {
    const balance = parseFloat(initialBalance);
    if (isNaN(balance) || balance < 0) {
      alert("Please enter a valid positive initial balance.");
      return;
    }
    if (expenseCategories.length === 0) {
      alert("Please select at least one expense category.");
      return;
    }
    if (incomeCategories.length === 0) {
      alert("Please select at least one income category.");
      return;
    }
    const payload = {
      initial_balance: balance,
      expense_categories: expenseCategories,
      income_categories: incomeCategories,
    };

    // Get the current session to retrieve the access token
    const sessionResponse = await supabase.auth.getSession();
    const session = sessionResponse.data.session;
    if (!session) {
      alert("User not authenticated.");
      return;
    }
    const accessToken = session.access_token;

    const response = await fetch(`${BACKEND_URL}/onboarding`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (response.ok) {
      router.push("/homepage");
    } else {
      alert(data.detail || "Error saving onboarding data.");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg p-8 space-y-6">
        <Stepper
          key={currentStep}
          initialStep={currentStep}
          onStepChange={handleStepChange}
          onFinalStepCompleted={submitOnboarding}
          backButtonText="Previous"
          nextButtonText="Next"
          nextButtonProps={{ onClick: handleNextClick }}
        >
          <Step>
            <div className="mb-6">
              <Label htmlFor="initialBalance" className="text-gray-300">
                Initial Balance
              </Label>
              <Input
                id="initialBalance"
                type="number"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder="0"
                required
                min="1"
                className="w-full px-4 py-2 rounded-md bg-neutral-950 text-white"
              />
            </div>
          </Step>
          <Step>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">
                Expense Categories
              </h2>
              <Select
                onValueChange={(value) => handleSelectExpenseCategory(value)}
                defaultValue=""
                className="w-full"
              >
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Select an expense category" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-950">
                  {predefinedExpenseCategories.map((cat) => (
                    <SelectItem key={cat.name} value={cat.name}>
                      <div className="flex items-center space-x-2">
                        {React.createElement(
                          iconMapping[cat.icon] || (() => null),
                          { className: "w-4 h-4" }
                        )}
                        <span>{cat.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="mt-8 flex flex-wrap gap-2">
                {expenseCategories.map((cat, index) => {
                  const IconComponent = iconMapping[cat.icon];
                  return (
                    <div
                      key={index}
                      className="flex items-center space-x-2 px-4 py-1 rounded-full"
                      style={{ border: "2px solid #266dd3" }}
                    >
                      {IconComponent && (
                        <IconComponent className="w-4 h-4 text-white" />
                      )}
                      <span className="text-white text-sm">{cat.name}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-8">
                <p className="text-gray-400 mb-2">
                  Or add a custom expense category:
                </p>
                <div className="flex space-x-4">
                  <Input
                    type="text"
                    value={customExpenseName}
                    onChange={(e) => setCustomExpenseName(e.target.value)}
                    placeholder="Category name"
                    className="w-full px-4 h-10 rounded-md bg-neutral-950 text-white"
                  />
                  <Select
                    value={customExpenseIcon}
                    onValueChange={(value) => setCustomExpenseIcon(value)}
                    defaultValue=""
                    className="w-full"
                  >
                    <SelectTrigger className="w-20 h-10">
                      <SelectValue placeholder="Icon" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-950 w-48 p-2">
                      <div className="grid grid-cols-3 gap-2">
                        {availableIcons.map((iconKey) => (
                          <SelectItem
                            key={iconKey}
                            value={iconKey}
                            className="flex items-center justify-center"
                          >
                            {React.createElement(
                              iconMapping[iconKey] || (() => null),
                              { className: "w-4 h-4" }
                            )}
                          </SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                </div>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={addCustomExpenseCategory}
                    className="w-full px-4 h-9 hover:bg-white bg-neutral-800 text-white hover:text-black rounded-md"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </Step>
          <Step>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">
                Income Categories
              </h2>
              <Select
                onValueChange={(value) => handleSelectIncomeCategory(value)}
                defaultValue=""
                className="w-full"
              >
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Select an income category" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-950">
                  {predefinedIncomeCategories.map((cat) => (
                    <SelectItem key={cat.name} value={cat.name}>
                      <div className="flex items-center space-x-2">
                        {React.createElement(
                          iconMapping[cat.icon] || (() => null),
                          { className: "w-4 h-4" }
                        )}
                        <span>{cat.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="mt-8 flex flex-wrap gap-2">
                {incomeCategories.map((cat, index) => {
                  const IconComponent = iconMapping[cat.icon];
                  return (
                    <div
                      key={index}
                      className="flex items-center space-x-2 px-4 py-1 rounded-full"
                      style={{ border: "2px solid #266dd3" }}
                    >
                      {IconComponent && (
                        <IconComponent className="w-4 h-4 text-white" />
                      )}
                      <span className="text-white text-sm">{cat.name}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-8">
                <p className="text-gray-400 mb-2">
                  Or add a custom income category:
                </p>
                <div className="flex space-x-4">
                  <Input
                    type="text"
                    value={customIncomeName}
                    onChange={(e) => setCustomIncomeName(e.target.value)}
                    placeholder="Category name"
                    className="w-full px-4 h-10 rounded-md bg-neutral-950 text-white"
                  />
                  <Select
                    value={customIncomeIcon}
                    onValueChange={(value) => setCustomIncomeIcon(value)}
                    defaultValue=""
                    className="w-full"
                  >
                    <SelectTrigger className="w-20 h-10">
                      <SelectValue placeholder="Icon" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-950 w-48 p-2">
                      <div className="grid grid-cols-3 gap-2">
                        {availableIcons.map((iconKey) => (
                          <SelectItem
                            key={iconKey}
                            value={iconKey}
                            className="flex items-center justify-center"
                          >
                            {React.createElement(
                              iconMapping[iconKey] || (() => null),
                              { className: "w-4 h-4" }
                            )}
                          </SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                </div>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={addCustomIncomeCategory}
                    className="w-full px-4 h-9 hover:bg-white bg-neutral-800 text-white hover:text-black rounded-md"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </Step>
        </Stepper>
      </div>
    </div>
  );
}
