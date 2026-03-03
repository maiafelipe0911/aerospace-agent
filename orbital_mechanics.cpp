#include <iostream>
#include <cmath>

struct TransferResult {
    double delta_v1;       // Queima inicial (km/s)
    double delta_v2;       // Queima de circularização (km/s)
    double total_delta_v;  // Custo total de combustível (km/s)
    double time_of_flight; // Tempo de viagem (horas)
};

class OrbitalMechanics {
private:
    // Constantes Físicas
    const double MU_EARTH = 398600.4418; // Parâmetro Gravitacional da Terra (km^3/s^2)
    const double R_EARTH = 6371.0;       // Raio médio da Terra (km)
    const double G = 6.67*std::pow(10, -20); // G em km^3kg^-1s^-2

public:
    // velocidade órbita circular
    double calc_circular_velocity(double altitude) {
        double r = altitude + R_EARTH;
        return std::sqrt(MU_EARTH / r);
    }

    //Transferência de Hohmann
    TransferResult hohmann_transfer(double alt_initial, double alt_final) {
        double r1 = alt_initial + R_EARTH;
        double r2 = alt_final + R_EARTH;

        // Semieixo maior da órbita de transferência
        double a_transfer = (r1 + r2) / 2.0;

        //1. v órbita inicial e na órbita final
        double v1 = calc_circular_velocity(alt_initial);
        double v2 = calc_circular_velocity(alt_final);

        // 2. V ap e perigeu trans orb
        double v_trans_perigee = std::sqrt(MU_EARTH * ((2.0 / r1) - (1.0 / a_transfer)));
        double v_trans_apogee = std::sqrt(MU_EARTH * ((2.0 / r2) - (1.0 / a_transfer)));

        // 3. Cálculo dos Delta-Vs (o custo de combustível)
        double dv1 = std::abs(v_trans_perigee - v1);
        double dv2 = std::abs(v2 - v_trans_apogee);

        // 4. Tempo de Voo 
        double time_seconds = M_PI * std::sqrt(std::pow(a_transfer, 3) / MU_EARTH);
        double time_hours = time_seconds / 3600.0;

        return {dv1, dv2, dv1 + dv2, time_hours};
    }
};

// deixando a funçao legivel para python.
extern "C" {
    
    // O __declspec(dllexport) é necessário no Windows para avisar que essa função deve ser exportada para fora do arquivo compilado.
    #ifdef _WIN32
    __declspec(dllexport)
    #endif
    TransferResult calculate_hohmann(double alt_initial, double alt_final) {
        OrbitalMechanics engine;
        return engine.hohmann_transfer(alt_initial, alt_final);
    }

}