#include "AriesPWM.h"

#define CLOCK_PIN 16
#define DATA_PIN  17
#define CS_PIN    18

AriesPWM_Matrix display(3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14);
uint8_t imageBuffer[102400]; 

int scrollX = 0;
bool isScrolling = false;
int scrollSpeed = 5;
unsigned long frameCount = 0;

void setup() { 
    display.begin(); 
    Serial.begin(115200); 
    pinMode(CLOCK_PIN, INPUT); pinMode(DATA_PIN, INPUT); pinMode(CS_PIN, INPUT_PULLUP);
    
    Serial.println("\n--- Aries True Color PWM Receiver ---");
    Serial.println("✅ Hardware Initialized. Waiting for ESP32 connection...");
}

void loop() {
    if (digitalRead(CS_PIN) == LOW) {
        Serial.println("\n🔗 ESP32 Connection Detected (CS LOW). Waking up...");
        long byteCount = 0; 
        uint8_t header[5];
        
        while (digitalRead(CS_PIN) == LOW && byteCount < 102405) {
            uint8_t receivedByte = 0;
            for (int i = 0; i < 8; i++) {
                unsigned long timeout = micros();
                
                while (digitalRead(CLOCK_PIN) == LOW) { 
                    if (digitalRead(CS_PIN) == HIGH || micros() - timeout > 2000000) {
                        Serial.println("❌ Transfer aborted during LOW clock wait.");
                        goto transfer_end; 
                    }
                }
                
                if (digitalRead(DATA_PIN) == HIGH) receivedByte |= (1 << i);
                timeout = micros();
                
                while (digitalRead(CLOCK_PIN) == HIGH) { 
                    if (micros() - timeout > 2000000) {
                        Serial.println("❌ Transfer aborted during HIGH clock wait.");
                        goto transfer_end; 
                    }
                }
            }
            if (byteCount < 5) header[byteCount] = receivedByte;
            else imageBuffer[byteCount - 5] = receivedByte;
            byteCount++;
        }
        
        transfer_end:
        if (byteCount == 102405 && header[0] == 0xAA) {
            isScrolling = (header[1] == 1);
            scrollSpeed = constrain(header[2], 1, 10);
            scrollX = 0;
            
            Serial.println("✅ Payload successfully received !");
            Serial.print("➡️ Mode: "); Serial.print(isScrolling ? "Panoramic Scrolling" : "Static Image");
            Serial.print(" | Speed: "); Serial.println(scrollSpeed);
            Serial.println("🚀 Display updated with new True Color content!");
        } else {
            Serial.print("⚠️ Incomplete or corrupt data received. Bytes caught: ");
            Serial.println(byteCount);
        }
        Serial.println("⏳ Rendering and waiting for next upload...");
    }

    // DRAW THE FRAME TO THE BUFFER
    display.clear();
    int byteIdx = 0;
    for(int y = 0; y < 160; y++) {
        for(int x = 0; x < 320; x++) {
            uint16_t color = (imageBuffer[byteIdx] << 8) | imageBuffer[byteIdx+1];
            byteIdx += 2;
            int drawX = isScrolling ? (x + scrollX) : x;
            display.drawPixelVert(drawX, y, (color >> 8) & 0x0F, (color >> 4) & 0x0F, color & 0x0F);
        }
    }
    
    // SMOOTH PWM REFRESH AND SCROLL MATH
    for(int i = 0; i < 15; i++) display.refreshBAM();
    
    if (isScrolling) {
        frameCount++;
        if (frameCount % (11 - scrollSpeed) == 0) {
            scrollX--; 
            if(scrollX < -320) scrollX = 0; 
        }
    }
}
