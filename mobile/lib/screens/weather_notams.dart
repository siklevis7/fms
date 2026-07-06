import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config.dart';
import 'dart:html' as html; // For web iframe if running on flutter web
import 'dart:ui' as ui;

class WeatherNotamsScreen extends StatefulWidget {
  final String token;
  final VoidCallback onLogout;

  const WeatherNotamsScreen({super.key, required this.token, required this.onLogout});

  @override
  State<WeatherNotamsScreen> createState() => _WeatherNotamsScreenState();
}

class _WeatherNotamsScreenState extends State<WeatherNotamsScreen> {
  final TextEditingController _icaoController = TextEditingController(text: 'HRYR');
  bool _isLoading = false;
  String _error = '';
  Map<String, dynamic>? _weather;
  
  // Track unique iframe id
  String _iframeId = 'windy_iframe';

  @override
  void initState() {
    super.initState();
    _fetchWeather();
    
    // Register the iframe view factory for Flutter Web
    // ignoring: undefined_prefixed_name
    ui.platformViewRegistry.registerViewFactory(_iframeId, (int viewId) {
      final iframe = html.IFrameElement()
        ..width = '100%'
        ..height = '100%'
        ..style.border = 'none'
        ..src = '';
      return iframe;
    });
  }

  Future<void> _fetchWeather() async {
    final icao = _icaoController.text.trim().toUpperCase();
    if (icao.isEmpty) return;
    
    setState(() {
      _isLoading = true;
      _error = '';
      _weather = null;
    });

    try {
      final res = await http.get(
        Uri.parse('${Config.baseUrl}/api/weather/$icao'),
        headers: {'Authorization': 'Bearer ${widget.token}'},
      );
      if (res.statusCode == 200) {
        setState(() {
          _weather = json.decode(res.body);
        });
      } else {
        setState(() {
          _error = 'Failed to fetch weather data. Check the ICAO code.';
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Network error while fetching weather.';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _icaoController,
                  decoration: const InputDecoration(
                    labelText: 'Enter ICAO Code (e.g. HRYR)',
                    border: OutlineInputBorder(),
                  ),
                  textCapitalization: TextCapitalization.characters,
                  maxLength: 4,
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: _isLoading ? null : _fetchWeather,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                ),
                child: _isLoading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Search'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          if (_error.isNotEmpty)
            Card(
              color: Colors.red.shade50,
              child: ListTile(
                leading: const Icon(Icons.warning, color: Colors.red),
                title: Text(_error, style: const TextStyle(color: Colors.red)),
              ),
            ),
            
          if (_weather != null && _weather!['metar'] != null)
            Card(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    color: Colors.lightBlue.shade900,
                    padding: const EdgeInsets.all(12),
                    child: const Text('Live METAR', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          color: Colors.grey.shade200,
                          child: Text(_weather!['metar']['rawOb'] ?? '', style: const TextStyle(fontFamily: 'monospace')),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _buildWeatherMetric('Temp', '${_weather!['metar']['temp']}°C'),
                            _buildWeatherMetric('Dewpoint', '${_weather!['metar']['dewp']}°C'),
                            _buildWeatherMetric('Wind', '${_weather!['metar']['wdir']}° @ ${_weather!['metar']['wspd']}kt'),
                            _buildWeatherMetric('Altimeter', '${_weather!['metar']['altim']} hPa'),
                          ],
                        )
                      ],
                    ),
                  )
                ],
              ),
            ),
            
          if (_weather != null && _weather!['taf'] != null)
            Card(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    color: Colors.indigo.shade900,
                    padding: const EdgeInsets.all(12),
                    child: const Text('Terminal Forecast (TAF)', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      color: Colors.grey.shade200,
                      child: Text(
                        (_weather!['taf']['rawTAF'] ?? '').replaceAll(RegExp(r' (BECMG|FM|PROB|TEMPO) '), '\n\$1 '),
                        style: const TextStyle(fontFamily: 'monospace'),
                      ),
                    ),
                  )
                ],
              ),
            ),
            
          const SizedBox(height: 16),
          if (_weather != null && _weather!['airport'] != null)
            Card(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    color: Colors.grey.shade800,
                    padding: const EdgeInsets.all(12),
                    child: const Text('Live Weather Radar (Windy)', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  ),
                  SizedBox(
                    height: 400,
                    child: Builder(builder: (context) {
                      // Note: HtmlElementView is for Flutter Web only.
                      // We recreate the iframe source whenever coordinates change by using a unique view type
                      final lat = _weather!['airport']['lat'];
                      final lon = _weather!['airport']['lon'];
                      final src = 'https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=%C2%B0C&metricWind=kt&zoom=7&overlay=wind&product=ecmwf&level=surface&lat=$lat&lon=$lon';
                      
                      final dynamic uiDynamic = ui;
                      uiDynamic.platformViewRegistry.registerViewFactory('windy_iframe_$lat', (int viewId) {
                        final iframe = html.IFrameElement()
                          ..width = '100%'
                          ..height = '100%'
                          ..style.border = 'none'
                          ..src = src;
                        return iframe;
                      });

                      return HtmlElementView(viewType: 'windy_iframe_$lat');
                    }),
                  )
                ],
              ),
            )
            
        ],
      ),
    );
  }

  Widget _buildWeatherMetric(String label, String value) {
    return Column(
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.bold)),
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
      ],
    );
  }
}
