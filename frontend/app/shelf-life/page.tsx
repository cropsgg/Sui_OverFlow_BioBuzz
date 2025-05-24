"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, FlaskConical, Thermometer, Droplets, Calendar, TrendingDown } from "lucide-react"

// Sample data based on the Python CSV structure
const biologicalSamples = [
  {
    "Biological Sample": "Blood",
    "Storage Temperature": -80,
    "Humidity (%)": 30,
    "Max Preservation Time (Years)": 10,
    "k (year^-1)": 0.15
  },
  {
    "Biological Sample": "Plasma",
    "Storage Temperature": -80,
    "Humidity (%)": 25,
    "Max Preservation Time (Years)": 8,
    "k (year^-1)": 0.18
  },
  {
    "Biological Sample": "Serum",
    "Storage Temperature": -20,
    "Humidity (%)": 35,
    "Max Preservation Time (Years)": 5,
    "k (year^-1)": 0.22
  },
  {
    "Biological Sample": "DNA",
    "Storage Temperature": -80,
    "Humidity (%)": 20,
    "Max Preservation Time (Years)": 20,
    "k (year^-1)": 0.08
  },
  {
    "Biological Sample": "RNA",
    "Storage Temperature": -80,
    "Humidity (%)": 15,
    "Max Preservation Time (Years)": 2,
    "k (year^-1)": 0.45
  },
  {
    "Biological Sample": "Tissue",
    "Storage Temperature": -80,
    "Humidity (%)": 40,
    "Max Preservation Time (Years)": 15,
    "k (year^-1)": 0.12
  },
  {
    "Biological Sample": "Bacteria Culture",
    "Storage Temperature": -80,
    "Humidity (%)": 30,
    "Max Preservation Time (Years)": 3,
    "k (year^-1)": 0.35
  },
  {
    "Biological Sample": "Cell Lines",
    "Storage Temperature": -196,
    "Humidity (%)": 10,
    "Max Preservation Time (Years)": 25,
    "k (year^-1)": 0.05
  }
]

// Weights for environmental factors
const weights = {
  "Storage Temperature": 0.8,
  "Humidity (%)": 0.2
}

interface PredictionResult {
  remainingLife: number
  kValue: number
  deviationScore: number
  sampleData: any
}

export default function ShelfLifePage() {
  const [selectedSample, setSelectedSample] = useState<string>("")
  const [temperature, setTemperature] = useState<string>("")
  const [humidity, setHumidity] = useState<string>("")
  const [prediction, setPrediction] = useState<PredictionResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const predictShelfLife = (sampleType: string, iotConditions: { "Storage Temperature": number, "Humidity (%)": number }) => {
    const sample = biologicalSamples.find(s => s["Biological Sample"] === sampleType)
    if (!sample) throw new Error("Sample not found")

    const baseLife = sample["Max Preservation Time (Years)"]
    const k = sample["k (year^-1)"]

    let deviationScore = 0
    for (const [col, weight] of Object.entries(weights)) {
      const ideal = sample[col as keyof typeof sample] as number
      const actual = iotConditions[col as keyof typeof iotConditions]
      const deviation = Math.pow(actual - ideal, 2) // Square the deviation
      deviationScore += weight * deviation
    }

    const remainingLife = baseLife * Math.exp(-k * deviationScore)
    return {
      remainingLife: Math.round(remainingLife * 100) / 100,
      kValue: k,
      deviationScore: Math.round(deviationScore * 100) / 100,
      sampleData: sample
    }
  }

  const handlePrediction = async () => {
    if (!selectedSample || !temperature || !humidity) {
      setError("Please fill in all fields")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const iotConditions = {
        "Storage Temperature": parseFloat(temperature),
        "Humidity (%)": parseFloat(humidity)
      }

      const result = predictShelfLife(selectedSample, iotConditions)
      setPrediction(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during prediction")
    } finally {
      setIsLoading(false)
    }
  }

  const getLifeStatusColor = (remainingLife: number, maxLife: number) => {
    const percentage = (remainingLife / maxLife) * 100
    if (percentage >= 70) return "text-green-600 dark:text-green-400"
    if (percentage >= 40) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  const getLifeStatusBadge = (remainingLife: number, maxLife: number) => {
    const percentage = (remainingLife / maxLife) * 100
    if (percentage >= 70) return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Excellent</Badge>
    if (percentage >= 40) return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Good</Badge>
    return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Critical</Badge>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold gradient-text">Biological Sample Shelf Life Predictor</h1>
        <p className="text-muted-foreground">
          Predict the remaining shelf life of biological samples based on real-time environmental conditions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Sample & Environmental Data
            </CardTitle>
            <CardDescription>
              Enter the biological sample type and current storage conditions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="sample-select">Biological Sample Type</Label>
              <Select value={selectedSample} onValueChange={setSelectedSample}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a sample type" />
                </SelectTrigger>
                <SelectContent>
                  {biologicalSamples.map((sample) => (
                    <SelectItem key={sample["Biological Sample"]} value={sample["Biological Sample"]}>
                      {sample["Biological Sample"]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperature" className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4" />
                  Temperature (°C)
                </Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  placeholder="e.g., -80"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="humidity" className="flex items-center gap-2">
                  <Droplets className="h-4 w-4" />
                  Humidity (%)
                </Label>
                <Input
                  id="humidity"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 30"
                  value={humidity}
                  onChange={(e) => setHumidity(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <Alert>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handlePrediction} 
              disabled={isLoading || !selectedSample || !temperature || !humidity}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Predicting...
                </>
              ) : (
                <>
                  <TrendingDown className="mr-2 h-4 w-4" />
                  Predict Shelf Life
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Prediction Results
            </CardTitle>
            <CardDescription>
              Estimated shelf life based on environmental conditions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {prediction ? (
              <div className="space-y-6">
                {/* Main Result */}
                <div className="text-center p-6 bg-muted/50 rounded-lg">
                  <div className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
                    <span className={getLifeStatusColor(prediction.remainingLife, prediction.sampleData["Max Preservation Time (Years)"])}>
                      {prediction.remainingLife}
                    </span>
                    <span className="text-muted-foreground text-lg">years</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Estimated remaining shelf life</p>
                  {getLifeStatusBadge(prediction.remainingLife, prediction.sampleData["Max Preservation Time (Years)"])}
                </div>

                {/* Detailed Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Sample Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Sample Type</p>
                      <p className="font-medium">{selectedSample}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Max Preservation Time</p>
                      <p className="font-medium">{prediction.sampleData["Max Preservation Time (Years)"]} years</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ideal Temperature</p>
                      <p className="font-medium">{prediction.sampleData["Storage Temperature"]}°C</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ideal Humidity</p>
                      <p className="font-medium">{prediction.sampleData["Humidity (%)"]}%</p>
                    </div>
                  </div>

                  <Separator />

                  <h4 className="font-semibold">Prediction Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Decay Constant (k)</p>
                      <p className="font-medium">{prediction.kValue} year⁻¹</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Deviation Score</p>
                      <p className="font-medium">{prediction.deviationScore}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Current Temperature</p>
                      <p className="font-medium">{temperature}°C</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Current Humidity</p>
                      <p className="font-medium">{humidity}%</p>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Recommendations</h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Monitor environmental conditions regularly</li>
                    <li>• Maintain temperature at {prediction.sampleData["Storage Temperature"]}°C for optimal preservation</li>
                    <li>• Keep humidity levels around {prediction.sampleData["Humidity (%)"]}%</li>
                    <li>• Consider relocating samples if conditions deviate significantly</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Enter sample data and environmental conditions to see prediction results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sample Data Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Available Sample Types</CardTitle>
          <CardDescription>
            Reference data for biological samples and their ideal storage conditions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Sample Type</th>
                  <th className="text-left p-2">Ideal Temp (°C)</th>
                  <th className="text-left p-2">Ideal Humidity (%)</th>
                  <th className="text-left p-2">Max Preservation (Years)</th>
                  <th className="text-left p-2">Decay Constant (k)</th>
                </tr>
              </thead>
              <tbody>
                {biologicalSamples.map((sample, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{sample["Biological Sample"]}</td>
                    <td className="p-2">{sample["Storage Temperature"]}</td>
                    <td className="p-2">{sample["Humidity (%)"]}</td>
                    <td className="p-2">{sample["Max Preservation Time (Years)"]}</td>
                    <td className="p-2">{sample["k (year^-1)"]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 